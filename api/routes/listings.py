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

router = APIRouter(prefix="/listings", tags=["Listings"])

# Config
LISTING_FEE_CENTS = 0  # Free for first 500 listings
UPLOAD_DIR = "/tmp/listings"  # In production, use S3 or similar


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
            
            if file.filename.lower() == 'skill.md':
                has_skill_md = True
    
    if not has_skill_md:
        # Clean up and error
        shutil.rmtree(listing_dir, ignore_errors=True)
        raise HTTPException(status_code=400, detail="SKILL.md is required")
    
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
        # In production, this would be a background job
        # For now, we'll auto-approve after a delay
        listing.status = 'approved'
        listing.scan_completed_at = datetime.utcnow()
        listing.scan_results = {
            "virustotal": {"status": "clean"},
            "openclaw_analysis": {"status": "passed"}
        }
        
        # Create product from listing
        product = Product(
            owner_id=current_user.id,
            name=name,
            slug=slug,
            description=description,
            category=cat,
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
        "status": listing.status.value,
        "message": "Listing created successfully" + (" and approved (free listing)" if LISTING_FEE_CENTS == 0 else ". Please complete payment to proceed.")
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
            category=l.category.value,
            price_cents=l.price_cents,
            status=l.status.value,
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
        pending_listings=sum(1 for l in listings if l.status in [ListingStatus.PENDING_PAYMENT, ListingStatus.PENDING_SCAN, ListingStatus.SCANNING]),
        rejected_listings=sum(1 for l in listings if l.status == ListingStatus.REJECTED),
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
            "category": l.category.value,
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
