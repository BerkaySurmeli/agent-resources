from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import select, func
from typing import List
from datetime import datetime
from uuid import UUID
from models import User, Product, Review, Transaction
from core.database import get_session

router = APIRouter(prefix="/developers", tags=["Developers"])

class DeveloperResponse(BaseModel):
    id: str
    name: str
    avatar_url: str | None
    is_verified: bool

class DeveloperListingResponse(BaseModel):
    id: str
    slug: str
    name: str
    category: str
    price_cents: int
    is_verified: bool

class DeveloperStatsResponse(BaseModel):
    total_listings: int
    total_sales: int
    average_rating: float
    total_reviews: int

@router.get("/{developer_id}", response_model=DeveloperResponse)
async def get_developer(
    developer_id: str,
    session = Depends(get_session)
):
    """Get developer public profile"""
    try:
        dev_uuid = UUID(developer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid developer ID")
    user = session.exec(select(User).where(User.id == dev_uuid)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Developer not found")

    return DeveloperResponse(
        id=str(user.id),
        name=user.name or "Anonymous",
        avatar_url=user.avatar_url,
        is_verified=user.is_verified
    )

@router.get("/{developer_id}/listings", response_model=List[DeveloperListingResponse])
async def get_developer_listings(
    developer_id: str,
    session = Depends(get_session)
):
    """Get all listings by a developer"""
    try:
        dev_uuid = UUID(developer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid developer ID")
    products = session.exec(
        select(Product)
        .where(Product.owner_id == dev_uuid, Product.is_active == True)
        .order_by(Product.created_at.desc())
    ).all()

    return [
        DeveloperListingResponse(
            id=str(p.id),
            slug=p.slug,
            name=p.name,
            category=p.category,
            price_cents=p.price_cents,
            is_verified=p.is_verified
        )
        for p in products
    ]

@router.get("/{developer_id}/stats", response_model=DeveloperStatsResponse)
async def get_developer_stats(
    developer_id: str,
    session = Depends(get_session)
):
    """Get developer statistics"""
    try:
        dev_uuid = UUID(developer_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid developer ID")

    # Count listings
    listings_count = session.exec(
        select(func.count(Product.id))
        .where(Product.owner_id == dev_uuid)
    ).first() or 0

    # Count sales
    sales_count = session.exec(
        select(func.count(Transaction.id))
        .where(
            Transaction.seller_id == dev_uuid,
            Transaction.status == "completed"
        )
    ).first() or 0

    # Get reviews for developer's products
    reviews = session.exec(
        select(Review)
        .join(Product, Review.product_id == Product.id)
        .where(Product.owner_id == dev_uuid)
    ).all()

    total_reviews = len(reviews)
    average_rating = sum(r.rating for r in reviews) / total_reviews if total_reviews > 0 else 0.0

    return DeveloperStatsResponse(
        total_listings=listings_count,
        total_sales=sales_count,
        average_rating=average_rating,
        total_reviews=total_reviews
    )
