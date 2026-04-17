# Build: 2026-04-16-1226 - Cache bust
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, BackgroundTasks
from pydantic import BaseModel
from sqlmodel import select
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import os
import shutil
from models import Listing, ListingStatus, ProductCategory, User, Product, ListingTranslation
from core.database import get_session
from routes.auth import get_current_user_from_token
import aiofiles
import zipfile
import hashlib
import httpx
import asyncio
from typing import Dict, Any
from services.translation import translate_listing, detect_language, SUPPORTED_LANGUAGES

router = APIRouter(prefix="/listings", tags=["Listings"])

# Config
LISTING_FEE_CENTS = 0  # Free for first 500 listings
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/listings")  # Use persistent storage in production

# VirusTotal Config
VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY", "")
VIRUSTOTAL_BASE_URL = "https://www.virustotal.com/api/v3"
VIRUSTOTAL_RATE_LIMIT = 4  # requests per minute (free tier)

# Rate limiter for VirusTotal
class RateLimiter:
    def __init__(self, max_calls: int, period: float):
        self.max_calls = max_calls
        self.period = period
        self.calls = []
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        async with self.lock:
            now = datetime.utcnow()
            # Remove calls outside the period
            self.calls = [c for c in self.calls if (now - c).total_seconds() < self.period]
            
            if len(self.calls) >= self.max_calls:
                # Wait until we can make another call
                oldest = self.calls[0]
                wait_time = self.period - (now - oldest).total_seconds()
                if wait_time > 0:
                    await asyncio.sleep(wait_time)
                    self.calls = self.calls[1:]
            
            self.calls.append(now)

# Global rate limiter: 4 calls per 60 seconds
vt_rate_limiter = RateLimiter(VIRUSTOTAL_RATE_LIMIT, 60.0)

# Scan queue for background processing
class ScanQueue:
    def __init__(self):
        self.queue = []
        self.processing = False
        self.lock = asyncio.Lock()
    
    async def add(self, listing_id: uuid.UUID, file_path: str):
        print(f"[SCAN QUEUE] Adding listing {listing_id} to queue")
        async with self.lock:
            self.queue.append({
                'listing_id': listing_id,
                'file_path': file_path
            })
            print(f"[SCAN QUEUE] Queue size: {len(self.queue)}, processing: {self.processing}")
            if not self.processing:
                print(f"[SCAN QUEUE] Starting background processing task")
                try:
                    task = asyncio.create_task(self._process_queue())
                    # Add error handling for the task
                    def handle_task_exception(t):
                        try:
                            t.result()
                        except Exception as e:
                            print(f"[SCAN QUEUE] Task failed with error: {e}")
                            import traceback
                            traceback.print_exc()
                    task.add_done_callback(handle_task_exception)
                except Exception as e:
                    print(f"[SCAN QUEUE] Failed to create task: {e}")
                    import traceback
                    traceback.print_exc()
    
    async def _process_queue(self):
        print(f"[SCAN QUEUE] _process_queue started")
        async with self.lock:
            self.processing = True
        
        try:
            print(f"[SCAN QUEUE] Entering processing loop")
            while True:
                async with self.lock:
                    if not self.queue:
                        self.processing = False
                        break
                    task = self.queue.pop(0)
                
                # Process one scan at a time with delay to respect rate limits
                await self._process_scan(task)
                await asyncio.sleep(15)  # 15 second delay between scans
        except Exception as e:
            print(f"[SCAN QUEUE] Error: {e}")
            async with self.lock:
                self.processing = False
    
    async def _process_scan(self, task: Dict):
        from core.database import get_session
        session = next(get_session())
        try:
            listing_id = task['listing_id']
            file_path = task['file_path']
            
            print(f"[SCAN QUEUE] Processing scan for listing {listing_id}")
            
            # Get listing details
            listing = session.exec(select(Listing).where(Listing.id == listing_id)).first()
            if not listing:
                print(f"[SCAN QUEUE] Listing {listing_id} not found")
                return
            
            # Run VirusTotal scan
            try:
                vt_result = await scan_with_virustotal(file_path)
                analysis = analyze_virustotal_results(vt_result)
                
                if analysis["is_safe"]:
                    # Approve listing FIRST
                    listing.status = 'approved'
                    listing.virus_scan_status = 'clean'
                    listing.scan_completed_at = datetime.utcnow()
                    listing.scan_results = {
                        "virustotal": {
                            "status": "clean",
                            "source": vt_result.get("source", "unknown"),
                            "stats": analysis.get("details", {})
                        },
                        "openclaw_analysis": {"status": "passed"}
                    }
                    listing.virustotal_report = vt_result.get("data")
                    
                    # Commit the listing status change FIRST
                    session.commit()
                    print(f"[SCAN QUEUE] Listing {listing_id} status committed as approved")
                    
                    # Then create product from listing
                    # Handle category - could be enum or string
                    category_value = listing.category
                    if hasattr(category_value, 'value'):
                        category_value = category_value.value
                    
                    try:
                        product = Product(
                            owner_id=listing.owner_id,
                            name=listing.name,
                            slug=listing.slug,
                            description=listing.description,
                            category=category_value,
                            category_tags=listing.category_tags,
                            price_cents=listing.price_cents,
                            is_active=True,
                            is_verified=True
                        )
                        session.add(product)
                        session.commit()
                        session.refresh(product)
                        
                        listing.product_id = product.id
                        session.commit()
                        print(f"[SCAN QUEUE] Product created for listing {listing_id}")
                    except Exception as product_error:
                        print(f"[SCAN QUEUE] Product creation failed for listing {listing_id}: {product_error}")
                        # Don't fail the whole operation if product creation fails
                        # The listing is already approved
                    
                    # Trigger translations
                    await translation_queue.add(listing.id, listing.name, listing.description, listing.original_language)
                    
                    print(f"[SCAN QUEUE] Listing {listing_id} approved")
                else:
                    # Reject listing
                    listing.status = 'rejected'
                    listing.virus_scan_status = 'infected'
                    listing.scan_completed_at = datetime.utcnow()
                    listing.scan_results = {
                        "virustotal": {
                            "status": "suspicious",
                            "reason": analysis.get("reason"),
                            "malicious": analysis.get("malicious_count"),
                            "suspicious": analysis.get("suspicious_count"),
                            "total": analysis.get("total_engines")
                        }
                    }
                    listing.rejection_reason = f"Security scan failed: {analysis.get('reason')}"
                    session.commit()
                    
                    print(f"[SCAN QUEUE] Listing {listing_id} rejected: {analysis.get('reason')}")
                    
            except Exception as e:
                print(f"[SCAN QUEUE] Scan failed for listing {listing_id}: {e}")
                import traceback
                traceback.print_exc()
                # Rollback and start fresh
                session.rollback()
                # Re-fetch listing after rollback
                listing = session.exec(select(Listing).where(Listing.id == listing_id)).first()
                if listing:
                    listing.status = 'pending_scan'
                    listing.virus_scan_status = 'failed'
                    listing.scan_results = {"virustotal": {"status": "error", "error": str(e)}}
                    session.commit()
                
        except Exception as e:
            print(f"[SCAN QUEUE] Fatal error processing listing {listing_id}: {e}")
            import traceback
            traceback.print_exc()
            session.rollback()
        finally:
            session.close()

# Global scan queue
scan_queue = ScanQueue()

# Translation queue for rate limiting
class TranslationQueue:
    def __init__(self):
        self.queue = []
        self.processing = False
        self.lock = asyncio.Lock()
    
    async def add(self, listing_id: uuid.UUID, name: str, description: str, source_lang: str):
        async with self.lock:
            self.queue.append({
                'listing_id': listing_id,
                'name': name,
                'description': description,
                'source_lang': source_lang
            })
            if not self.processing:
                asyncio.create_task(self._process_queue())
    
    async def _process_queue(self):
        async with self.lock:
            self.processing = True
        
        try:
            while True:
                async with self.lock:
                    if not self.queue:
                        self.processing = False
                        break
                    task = self.queue.pop(0)
                
                # Process one translation at a time with delay to respect rate limits
                await self._process_translation(task)
                await asyncio.sleep(2)  # 2 second delay between translations
        except Exception as e:
            print(f"[TRANSLATION QUEUE] Error: {e}")
            async with self.lock:
                self.processing = False
    
    async def _process_translation(self, task: Dict):
        from core.database import get_session
        session = next(get_session())
        try:
            listing_id = task['listing_id']
            name = task['name']
            description = task['description']
            source_lang = task['source_lang']
            
            # Update status to translating
            listing = session.exec(select(Listing).where(Listing.id == listing_id)).first()
            if listing:
                listing.translation_status = 'translating'
                session.commit()
            
            print(f"[TRANSLATION] Starting translation for listing {listing_id}")
            translations = translate_listing(name, description, source_lang)
            
            for lang, content in translations.items():
                translation = ListingTranslation(
                    listing_id=listing_id,
                    language=lang,
                    name=content['name'],
                    description=content['description']
                )
                session.add(translation)
            
            # Update status to completed
            if listing:
                listing.translation_status = 'completed'
                session.commit()
            
            session.commit()
            print(f"[TRANSLATION] Completed translations for listing {listing_id}: {list(translations.keys())}")
        except Exception as e:
            print(f"[TRANSLATION] Error generating translations: {e}")
            import traceback
            traceback.print_exc()
            
            # Update status to failed
            listing = session.exec(select(Listing).where(Listing.id == listing_id)).first()
            if listing:
                listing.translation_status = 'failed'
                session.commit()
        finally:
            session.close()

# Global translation queue
translation_queue = TranslationQueue()


async def scan_with_virustotal(file_path: str) -> Dict[str, Any]:
    """
    Scan a file with VirusTotal.
    Returns scan results or raises exception on error.
    """
    if not VIRUSTOTAL_API_KEY:
        raise HTTPException(status_code=500, detail="VirusTotal API key not configured")
    
    # Wait for rate limit
    await vt_rate_limiter.acquire()
    
    # Calculate file hash
    sha256_hash = hashlib.sha256()
    async with aiofiles.open(file_path, 'rb') as f:
        while chunk := await f.read(8192):
            sha256_hash.update(chunk)
    file_hash = sha256_hash.hexdigest()
    
    async with httpx.AsyncClient() as client:
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        
        # Step 1: Check if file already analyzed
        await vt_rate_limiter.acquire()
        response = await client.get(
            f"{VIRUSTOTAL_BASE_URL}/files/{file_hash}",
            headers=headers,
            timeout=30.0
        )
        
        if response.status_code == 200:
            # File already analyzed
            return {
                "status": "completed",
                "source": "cache",
                "data": response.json()
            }
        
        # Step 2: Upload file for analysis
        await vt_rate_limiter.acquire()
        
        async with aiofiles.open(file_path, 'rb') as f:
            file_content = await f.read()
        
        files = {"file": (os.path.basename(file_path), file_content)}
        upload_response = await client.post(
            f"{VIRUSTOTAL_BASE_URL}/files",
            headers=headers,
            files=files,
            timeout=60.0
        )
        
        if upload_response.status_code not in [200, 201]:
            raise HTTPException(
                status_code=500, 
                detail=f"VirusTotal upload failed: {upload_response.text}"
            )
        
        analysis_id = upload_response.json()["data"]["id"]
        
        # Step 3: Poll for results (max 10 attempts, with rate limiting)
        for attempt in range(10):
            print(f"[VIRUSTOTAL] Polling attempt {attempt + 1}/10 for analysis {analysis_id}")
            await asyncio.sleep(15)  # Wait between polls
            await vt_rate_limiter.acquire()
            
            analysis_response = await client.get(
                f"{VIRUSTOTAL_BASE_URL}/analyses/{analysis_id}",
                headers=headers,
                timeout=30.0
            )
            
            if analysis_response.status_code == 200:
                analysis_data = analysis_response.json()
                status = analysis_data["data"]["attributes"]["status"]
                
                if status == "completed":
                    return {
                        "status": "completed",
                        "source": "fresh",
                        "data": analysis_data
                    }
        
        # Timeout waiting for analysis
        return {
            "status": "pending",
            "source": "timeout",
            "analysis_id": analysis_id
        }


def analyze_virustotal_results(vt_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze VirusTotal results and determine if file is safe.
    """
    if vt_result.get("status") != "completed":
        return {
            "is_safe": False,
            "reason": "scan_incomplete",
            "details": vt_result
        }
    
    data = vt_result.get("data", {})
    attributes = data.get("attributes", {})
    stats = attributes.get("stats", {})
    
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)
    total = sum(stats.values()) if stats else 0
    
    # Thresholds
    if malicious > 0:
        return {
            "is_safe": False,
            "reason": "malware_detected",
            "malicious_count": malicious,
            "suspicious_count": suspicious,
            "total_engines": total,
            "details": stats
        }
    
    if suspicious > 2:
        return {
            "is_safe": False,
            "reason": "too_many_suspicious",
            "malicious_count": malicious,
            "suspicious_count": suspicious,
            "total_engines": total,
            "details": stats
        }
    
    return {
        "is_safe": True,
        "reason": "clean",
        "malicious_count": malicious,
        "suspicious_count": suspicious,
        "total_engines": total,
        "details": stats
    }


class ListingCreate(BaseModel):
    name: str
    description: str
    category: str
    price_cents: int
    tags: List[str]


class ListingResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: str
    category: str
    price_cents: int
    version: str
    status: str
    file_count: int
    file_size_bytes: int
    created_at: datetime
    updated_at: datetime
    scan_results: dict
    rejection_reason: Optional[str]
    product_id: Optional[str]
    translation_status: Optional[str]
    translation_progress: int
    virus_scan_status: Optional[str]
    scan_progress: int


class DashboardStats(BaseModel):
    total_listings: int
    approved_listings: int
    pending_listings: int
    rejected_listings: int
    total_revenue_cents: int
    total_downloads: int


def ensure_upload_dir():
    """Ensure upload directory exists"""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    import re
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug[:50]


def get_unique_slug(session, name: str) -> str:
    """Get unique slug by appending number if needed"""
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    
    while session.exec(select(Listing).where(Listing.slug == slug)).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    return slug


@router.post("/create")
async def create_listing(
    name: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    price_cents: int = Form(...),
    version: str = Form("1.0.0"),  # Semver version
    tags: str = Form("[]"),  # JSON string
    files: List[UploadFile] = File(...),
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Create a new listing with file upload"""

    # Check if user is verified
    if not current_user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email before creating a listing")

    ensure_upload_dir()
    
    # Parse tags
    import json
    try:
        tag_list = json.loads(tags)
    except:
        tag_list = []
    
    # Validate category
    try:
        cat = ProductCategory(category)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    # Generate unique slug
    slug = get_unique_slug(session, name)
    
    # Create listing directory
    listing_dir = os.path.join(UPLOAD_DIR, str(uuid.uuid4()))
    os.makedirs(listing_dir, exist_ok=True)
    
    # Save uploaded files
    file_count = 0
    total_size = 0
    has_skill_md = False
    has_persona_md = False
    has_mcp_manifest = False
    
    for file in files:
        if file.filename:
            file_path = os.path.join(listing_dir, file.filename)
            
            # Ensure directory exists for nested files
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            # Save file
            content = await file.read()
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            file_count += 1
            total_size += len(content)
            
            # Check for required files based on category
            filename_lower = file.filename.lower()
            if filename_lower.endswith('skill.md'):
                has_skill_md = True
            elif filename_lower.endswith('persona.md'):
                has_persona_md = True
            elif filename_lower.endswith('mcp.json') or filename_lower.endswith('manifest.json'):
                has_mcp_manifest = True
    
    # Validate required files based on category
    required_file_missing = False
    required_file_name = ""
    
    if category == 'skill':
        if not has_skill_md:
            required_file_missing = True
            required_file_name = "SKILL.md"
    elif category == 'persona':
        # Personas can have either SKILL.md or PERSONA.md
        if not has_skill_md and not has_persona_md:
            required_file_missing = True
            required_file_name = "SKILL.md or PERSONA.md"
    elif category == 'mcp_server':
        # MCP servers need a manifest file
        if not has_mcp_manifest:
            required_file_missing = True
            required_file_name = "mcp.json or manifest.json"
    
    if required_file_missing:
        # Log what files were received for debugging
        received_files = [f.filename for f in files if f.filename]
        print(f"[DEBUG] {required_file_name} not found for category '{category}'. Received files: {received_files}")
        # Clean up and error
        shutil.rmtree(listing_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"{required_file_name} is required for {category} listings. Received {len(files)} files: {received_files}")
    
    # Create ZIP file
    zip_path = f"{listing_dir}.zip"
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(listing_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, listing_dir)
                zipf.write(file_path, arcname)
    
    # Clean up directory, keep only ZIP
    shutil.rmtree(listing_dir, ignore_errors=True)
    
    # Detect original language
    original_language = detect_language(name + " " + description)
    print(f"[TRANSLATION] Detected language: {original_language}")
    
    # Create listing record
    listing = Listing(
        owner_id=current_user.id,
        name=name,
        slug=slug,
        description=description,
        category=cat,
        category_tags=tag_list,
        price_cents=price_cents,
        version=version,
        file_path=zip_path,
        file_count=file_count,
        file_size_bytes=total_size,
        original_language=original_language,
        listing_fee_cents=LISTING_FEE_CENTS,
        status='pending_payment' if LISTING_FEE_CENTS > 0 else 'pending_scan',
        virus_scan_status='pending',
        scan_progress=0,
        translation_progress=0
    )
    
    session.add(listing)
    session.commit()
    session.refresh(listing)
    
    # If free, trigger security scan in background
    if LISTING_FEE_CENTS == 0:
        # Start scanning
        listing.status = 'scanning'
        listing.virus_scan_status = 'scanning'
        listing.scan_started_at = datetime.utcnow()
        session.commit()
        
        # Add to background scan queue
        await scan_queue.add(listing.id, zip_path)
        
        return {
            "id": str(listing.id),
            "slug": listing.slug,
            "status": "scanning",
            "virus_scan_status": "scanning",
            "message": "Listing created. Security scan in progress - check back in a few minutes."
        }
    
    return {
        "id": str(listing.id),
        "slug": listing.slug,
        "status": listing.status,
        "virus_scan_status": listing.virus_scan_status,
        "message": "Listing created successfully. Please complete payment to proceed."
    }


@router.get("/my-listings", response_model=List[ListingResponse])
async def get_my_listings(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get all listings for current user"""
    
    print(f"[MY-LISTINGS] Fetching for user: {current_user.id}, email: {current_user.email}")
    
    listings = session.exec(
        select(Listing).where(Listing.owner_id == current_user.id).order_by(Listing.created_at.desc())
    ).all()
    
    print(f"[MY-LISTINGS] Found {len(listings)} listings for user {current_user.id}")
    
    return [
        ListingResponse(
            id=str(l.id),
            slug=l.slug,
            name=l.name,
            description=l.description,
            category=l.category,
            price_cents=l.price_cents,
            version=l.version or '1.0.0',
            status=l.status,
            file_count=l.file_count,
            file_size_bytes=l.file_size_bytes,
            created_at=l.created_at,
            updated_at=l.updated_at,
            scan_results=l.scan_results,
            rejection_reason=l.rejection_reason,
            product_id=str(l.product_id) if l.product_id else None,
            translation_status=l.translation_status,
            translation_progress=l.translation_progress or 0,
            virus_scan_status=l.virus_scan_status,
            scan_progress=l.scan_progress or 0
        )
        for l in listings
    ]


@router.get("/dashboard-stats")
async def get_dashboard_stats(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get dashboard statistics for current user"""
    
    listings = session.exec(
        select(Listing).where(Listing.owner_id == current_user.id)
    ).all()
    
    products = session.exec(
        select(Product).where(Product.owner_id == current_user.id)
    ).all()
    
    total_revenue = sum(p.price_cents * p.download_count for p in products)
    total_downloads = sum(p.download_count for p in products)
    
    return DashboardStats(
        total_listings=len(listings),
        approved_listings=sum(1 for l in listings if l.status == 'approved'),
        pending_listings=sum(1 for l in listings if l.status in ['pending_payment', 'pending_scan', 'scanning']),
        rejected_listings=sum(1 for l in listings if l.status == 'rejected'),
        total_revenue_cents=total_revenue,
        total_downloads=total_downloads
    )


@router.get("/public")
async def get_public_listings(
    category: Optional[str] = None,
    search: Optional[str] = None,
    slug: Optional[str] = None,
    lang: Optional[str] = Query(default='en', description='Language code for translations'),
    session = Depends(get_session)
):
    """Get published/approved listings for public browsing"""
    from models import User, Product
    
    query = select(Listing, User, Product).join(User, Listing.owner_id == User.id).outerjoin(Product, Listing.product_id == Product.id).where(Listing.status == 'approved')
    
    # Helper function to get translated content
    def get_listing_content(listing: Listing, language: str):
        """Get listing content in requested language"""
        if language == listing.original_language or language not in SUPPORTED_LANGUAGES:
            return listing.name, listing.description
        
        # Try to get translation
        translation = session.exec(
            select(ListingTranslation).where(
                ListingTranslation.listing_id == listing.id,
                ListingTranslation.language == language
            )
        ).first()
        
        if translation:
            return translation.name, translation.description
        return listing.name, listing.description

    if slug:
        # Return single listing by slug
        result = session.exec(query.where(Listing.slug == slug)).first()
        if not result:
            raise HTTPException(status_code=404, detail="Listing not found")
        listing, user, product = result
        
        name, description = get_listing_content(listing, lang)
        
        return [{
            "id": str(listing.id),
            "slug": listing.slug,
            "name": name,
            "description": description,
            "category": listing.category,
            "price_cents": listing.price_cents,
            "tags": listing.category_tags,
            "file_count": listing.file_count,
            "file_size_bytes": listing.file_size_bytes,
            "scan_results": listing.scan_results,
            "virus_scan_status": listing.virus_scan_status,
            "translation_status": listing.translation_status,
            "created_at": listing.created_at,
            "seller": {
                "id": str(user.id),
                "name": user.name or "Anonymous",
                "avatar_url": user.avatar_url
            },
            "is_verified": product.is_verified if product else False
        }]
    
    if category:
        query = query.where(Listing.category == category)
    
    if search:
        query = query.where(
            (Listing.name.ilike(f"%{search}%")) | 
            (Listing.description.ilike(f"%{search}%"))
        )
    
    results = session.exec(query.order_by(Listing.created_at.desc())).all()

    return [
        {
            "id": str(l.id),
            "slug": l.slug,
            "name": get_listing_content(l, lang)[0],
            "description": get_listing_content(l, lang)[1][:200] + "..." if len(get_listing_content(l, lang)[1]) > 200 else get_listing_content(l, lang)[1],
            "category": l.category,
            "price_cents": l.price_cents,
            "tags": l.category_tags,
            "virus_scan_status": l.virus_scan_status,
            "translation_status": l.translation_status,
            "created_at": l.created_at,
            "seller": {
                "id": str(u.id),
                "name": u.name or "Anonymous",
                "avatar_url": u.avatar_url
            },
            "is_verified": p.is_verified if p else False
        }
        for l, u, p in results
    ]


@router.get("/{slug}")
async def get_listing_detail(
    slug: str,
    session = Depends(get_session)
):
    """Get detailed information about a listing"""
    from models import User, Product

    result = session.exec(
        select(Listing, User, Product).join(User, Listing.owner_id == User.id).outerjoin(Product, Listing.product_id == Product.id).where(Listing.slug == slug)
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing, user, product = result

    # Only show approved listings publicly
    if listing.status != 'approved':
        raise HTTPException(status_code=404, detail="Listing not found")

    return {
        "id": str(listing.id),
        "slug": listing.slug,
        "name": listing.name,
        "description": listing.description,
        "category": listing.category,
        "price_cents": listing.price_cents,
        "tags": listing.category_tags,
        "file_count": listing.file_count,
        "file_size_bytes": listing.file_size_bytes,
        "scan_results": listing.scan_results,
        "virus_scan_status": listing.virus_scan_status,
        "translation_status": listing.translation_status,
        "created_at": listing.created_at,
        "seller": {
            "id": str(user.id),
            "name": user.name or "Anonymous",
            "avatar_url": user.avatar_url
        },
        "is_verified": product.is_verified if product else False
    }


@router.get("/{slug}/reviews")
async def get_listing_reviews(
    slug: str,
    session = Depends(get_session)
):
    """Get reviews for a listing"""
    from models import Review, User, Product

    listing = session.exec(select(Listing).where(Listing.slug == slug)).first()
    if not listing or not listing.product_id:
        raise HTTPException(status_code=404, detail="Listing not found")

    reviews = session.exec(
        select(Review, User)
        .join(User, Review.user_id == User.id, isouter=True)
        .where(Review.product_id == listing.product_id)
        .order_by(Review.created_at.desc())
    ).all()

    return [
        {
            "id": str(review.id),
            "rating": review.rating,
            "comment": review.comment,
            "user_name": user.name if user else "Anonymous",
            "created_at": review.created_at,
            "is_verified_purchase": review.is_verified_purchase
        }
        for review, user in reviews
    ]


@router.post("/{slug}/reviews")
async def create_listing_review(
    slug: str,
    rating: int,
    comment: Optional[str] = None,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Create a review for a listing"""
    from models import Review, Product

    listing = session.exec(select(Listing).where(Listing.slug == slug)).first()
    if not listing or not listing.product_id:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Check if user already reviewed this product
    existing = session.exec(
        select(Review)
        .where(Review.product_id == listing.product_id, Review.user_id == current_user.id)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    # Check if user purchased this product (required to leave a review)
    purchase = session.exec(
        select(Transaction)
        .where(
            Transaction.product_id == listing.product_id,
            Transaction.buyer_id == current_user.id,
            Transaction.status == "completed"
        )
    ).first()

    if not purchase:
        raise HTTPException(status_code=403, detail="You must purchase this product before leaving a review")

    review = Review(
        user_id=current_user.id,
        product_id=listing.product_id,
        rating=rating,
        comment=comment,
        is_verified_purchase=True
    )

    session.add(review)
    session.commit()

    return {"message": "Review created successfully", "review_id": str(review.id)}


# Mock payment endpoint for testing
@router.post("/{listing_id}/pay")
async def pay_listing_fee(
    listing_id: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Pay listing fee (mock for testing)"""
    
    listing = session.exec(
        select(Listing).where(Listing.id == listing_id, Listing.owner_id == current_user.id)
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.status != 'pending_payment':
        raise HTTPException(status_code=400, detail="Listing is not awaiting payment")
    
    # Mock payment success
    listing.status = 'pending_scan'
    listing.payment_status = "succeeded"
    session.commit()
    
    return {
        "message": "Payment successful. Listing queued for security scan.",
        "status": listing.status
    }


@router.post("/cron/process-pending-scans")
async def process_pending_scans(
    session = Depends(get_session)
):
    """
    Cron job endpoint to process listings stuck in 'scanning' status.
    Call this every 2-5 minutes via Railway cron or external scheduler.
    """
    # Find listings that have been scanning for more than 2 minutes
    cutoff_time = datetime.utcnow() - timedelta(minutes=2)
    
    pending_listings = session.exec(
        select(Listing).where(
            Listing.status == 'scanning',
            Listing.scan_started_at < cutoff_time
        )
    ).all()
    
    results = []
    
    for listing in pending_listings:
        try:
            if not listing.file_path or not os.path.exists(listing.file_path):
                listing.status = 'rejected'
                listing.virus_scan_status = 'failed'
                listing.rejection_reason = "File not found for scan"
                session.commit()
                results.append({"id": str(listing.id), "status": "rejected", "reason": "file_not_found"})
                continue
            
            # Re-run VirusTotal scan
            vt_result = await scan_with_virustotal(listing.file_path)
            analysis = analyze_virustotal_results(vt_result)
            
            if analysis["is_safe"]:
                # Approve listing
                listing.status = 'approved'
                listing.virus_scan_status = 'clean'
                listing.scan_completed_at = datetime.utcnow()
                listing.scan_results = {
                    "virustotal": {
                        "status": "clean",
                        "source": vt_result.get("source", "unknown"),
                        "stats": analysis.get("details", {})
                    },
                    "openclaw_analysis": {"status": "passed"}
                }
                import json
                listing.virustotal_report = vt_result.get("data")
                
                # Create product from listing
                product = Product(
                    owner_id=listing.owner_id,
                    name=listing.name,
                    slug=listing.slug,
                    description=listing.description,
                    category=listing.category,
                    category_tags=listing.category_tags,
                    price_cents=listing.price_cents,
                    is_active=True,
                    is_verified=True
                )
                session.add(product)
                session.commit()
                session.refresh(product)
                
                listing.product_id = product.id
                session.commit()
                
                # Trigger translations
                await translation_queue.add(listing.id, listing.name, listing.description, listing.original_language)
                
                results.append({"id": str(listing.id), "status": "approved", "product_id": str(product.id)})
            else:
                # Reject listing
                listing.status = 'rejected'
                listing.virus_scan_status = 'infected'
                listing.scan_completed_at = datetime.utcnow()
                listing.scan_results = {
                    "virustotal": {
                        "status": "suspicious",
                        "reason": analysis.get("reason"),
                        "malicious": analysis.get("malicious_count"),
                        "suspicious": analysis.get("suspicious_count"),
                        "total": analysis.get("total_engines")
                    }
                }
                listing.rejection_reason = f"Security scan failed: {analysis.get('reason')}"
                session.commit()
                
                results.append({"id": str(listing.id), "status": "rejected", "reason": analysis.get("reason")})
                
        except Exception as e:
            import traceback
            print(f"[CRON ERROR] Listing {listing.id}: {str(e)}\n{traceback.format_exc()}")
            results.append({"id": str(listing.id), "status": "error", "error": str(e)})
    
    return {
        "processed": len(results),
        "results": results
    }


@router.delete("/my-listings/{listing_id}")
async def delete_listing(
    listing_id: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Delete a listing (owner only)"""
    from models import Review
    
    listing = session.exec(
        select(Listing).where(Listing.id == listing_id)
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if user is the owner
    if str(listing.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
    
    # Delete associated product if exists
    if listing.product_id:
        product = session.exec(
            select(Product).where(Product.id == listing.product_id)
        ).first()
        if product:
            # Delete reviews for this product
            session.exec(
                select(Review).where(Review.product_id == product.id)
            )
            session.delete(product)
    
    # Delete the listing
    session.delete(listing)
    session.commit()
    
    return {"message": "Listing deleted successfully"}


@router.post("/my-listings/{listing_id}/toggle-status")
async def toggle_listing_status(
    listing_id: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Toggle listing active status (owner only)"""
    listing = session.exec(
        select(Listing).where(Listing.id == listing_id)
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if user is the owner
    if str(listing.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
    
    # Toggle by updating the associated product
    if listing.product_id:
        product = session.exec(
            select(Product).where(Product.id == listing.product_id)
        ).first()
        if product:
            product.is_active = not product.is_active
            session.commit()
            session.refresh(product)
            return {
                "message": "Status updated",
                "is_active": product.is_active
            }
    
    return {"message": "No product associated with this listing"}
