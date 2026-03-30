from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from sqlmodel import select
from typing import List, Optional
from datetime import datetime
import uuid
import os
import shutil
from models import Listing, ListingStatus, ProductCategory, User, Product
from core.database import get_session
from routes.auth import get_current_user_from_token
import aiofiles
import zipfile
import hashlib
import httpx
import asyncio
from typing import Dict, Any

router = APIRouter(prefix="/listings", tags=["Listings"])

# Config
LISTING_FEE_CENTS = 0  # Free for first 500 listings
UPLOAD_DIR = "/tmp/listings"  # In production, use S3 or similar

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
    name: str
    description: str
    category: str
    price_cents: int
    status: str
    file_count: int
    file_size_bytes: int
    created_at: datetime
    updated_at: datetime
    scan_results: dict
    rejection_reason: Optional[str]
    product_id: Optional[str]


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
    tags: str = Form("[]"),  # JSON string
    files: List[UploadFile] = File(...),
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Create a new listing with file upload"""
    
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
            
            # Check for SKILL.md (handle both 'SKILL.md' and 'folder/SKILL.md')
            if file.filename and file.filename.lower().endswith('skill.md'):
                has_skill_md = True
    
    if not has_skill_md:
        # Log what files were received for debugging
        received_files = [f.filename for f in files if f.filename]
        print(f"[DEBUG] SKILL.md not found. Received files: {received_files}")
        # Clean up and error
        shutil.rmtree(listing_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail=f"SKILL.md is required. Received {len(files)} files: {received_files}")
    
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
    
    # Create listing record
    listing = Listing(
        owner_id=current_user.id,
        name=name,
        slug=slug,
        description=description,
        category=cat,
        category_tags=tag_list,
        price_cents=price_cents,
        file_path=zip_path,
        file_count=file_count,
        file_size_bytes=total_size,
        listing_fee_cents=LISTING_FEE_CENTS,
        status='pending_payment' if LISTING_FEE_CENTS > 0 else 'pending_scan'
    )
    
    session.add(listing)
    session.commit()
    session.refresh(listing)
    
    # If free, trigger security scan
    if LISTING_FEE_CENTS == 0:
        # Start scanning
        listing.status = 'scanning'
        listing.scan_started_at = datetime.utcnow()
        session.commit()
        
        # Run VirusTotal scan
        try:
            vt_result = await scan_with_virustotal(zip_path)
            analysis = analyze_virustotal_results(vt_result)
            
            if analysis["is_safe"]:
                # Approve listing
                listing.status = 'approved'
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
                
                # Create product from listing
                product = Product(
                    owner_id=current_user.id,
                    name=name,
                    slug=slug,
                    description=description,
                    category=category,
                    category_tags=tag_list,
                    price_cents=price_cents,
                    is_active=True,
                    is_verified=True
                )
                session.add(product)
                session.commit()
                session.refresh(product)
                
                listing.product_id = product.id
                session.commit()
                
                return {
                    "id": str(listing.id),
                    "slug": listing.slug,
                    "status": listing.status,
                    "message": "Listing created and approved after security scan"
                }
            else:
                # Reject listing
                listing.status = 'rejected'
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
                
                return {
                    "id": str(listing.id),
                    "slug": listing.slug,
                    "status": listing.status,
                    "message": f"Listing rejected: {analysis.get('reason')}"
                }
                
        except Exception as e:
            # Scan failed - mark as pending for manual review
            import traceback
            error_details = traceback.format_exc()
            print(f"[VIRUSTOTAL ERROR] {str(e)}\n{error_details}")
            
            listing.status = 'pending_scan'
            listing.scan_results = {
                "virustotal": {"status": "error", "error": str(e), "trace": error_details[:500]}
            }
            session.commit()
            
            return {
                "id": str(listing.id),
                "slug": listing.slug,
                "status": listing.status,
                "message": f"Listing created but security scan failed: {str(e)[:100]}"
            }
    
    return {
        "id": str(listing.id),
        "slug": listing.slug,
        "status": listing.status,
        "message": "Listing created successfully. Please complete payment to proceed."
    }


@router.get("/my-listings", response_model=List[ListingResponse])
async def get_my_listings(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get all listings for current user"""
    
    listings = session.exec(
        select(Listing).where(Listing.owner_id == current_user.id).order_by(Listing.created_at.desc())
    ).all()
    
    return [
        ListingResponse(
            id=str(l.id),
            name=l.name,
            description=l.description,
            category=l.category,
            price_cents=l.price_cents,
            status=l.status,
            file_count=l.file_count,
            file_size_bytes=l.file_size_bytes,
            created_at=l.created_at,
            updated_at=l.updated_at,
            scan_results=l.scan_results,
            rejection_reason=l.rejection_reason,
            product_id=str(l.product_id) if l.product_id else None
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
    session = Depends(get_session)
):
    """Get published/approved listings for public browsing"""
    
    query = select(Listing).where(Listing.status == 'approved')
    
    if category:
        query = query.where(Listing.category == category)
    
    if search:
        query = query.where(
            (Listing.name.ilike(f"%{search}%")) | 
            (Listing.description.ilike(f"%{search}%"))
        )
    
    listings = session.exec(query.order_by(Listing.created_at.desc())).all()
    
    return [
        {
            "id": str(l.id),
            "slug": l.slug,
            "name": l.name,
            "description": l.description[:200] + "..." if len(l.description) > 200 else l.description,
            "category": l.category,
            "price_cents": l.price_cents,
            "tags": l.category_tags,
            "created_at": l.created_at
        }
        for l in listings
    ]


@router.get("/{slug}")
async def get_listing_detail(
    slug: str,
    session = Depends(get_session)
):
    """Get detailed information about a listing"""
    
    listing = session.exec(
        select(Listing).where(Listing.slug == slug)
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Only show approved listings publicly
    if listing.status != 'approved':
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return {
        "id": str(listing.id),
        "slug": listing.slug,
        "name": listing.name,
        "description": listing.description,
        "category": listing.category.value,
        "price_cents": listing.price_cents,
        "tags": listing.category_tags,
        "file_count": listing.file_count,
        "file_size_bytes": listing.file_size_bytes,
        "created_at": listing.created_at
    }


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
        "status": listing.status.value
    }
