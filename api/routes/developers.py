from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import select, func
from typing import List, Optional
from uuid import UUID
from models import User, Product, Review, Transaction, Listing, Collection, Subscription
from core.database import get_session

router = APIRouter(prefix="/developers", tags=["Developers"])


class DeveloperResponse(BaseModel):
    id: str
    name: str
    avatar_url: Optional[str]
    profile_slug: Optional[str]
    bio: Optional[str]
    website: Optional[str]
    twitter: Optional[str]
    github: Optional[str]
    is_verified: bool
    is_developer: bool
    is_pro: bool = False


class DeveloperListingResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: Optional[str]
    category: str
    price_cents: int
    is_verified: bool
    download_count: int
    quality_score: int = 0


class DeveloperStatsResponse(BaseModel):
    total_listings: int
    total_sales: int
    average_rating: float
    total_reviews: int


def _lookup_user(identifier: str, session) -> User:
    """Resolve identifier as UUID first, then fall back to profile_slug."""
    try:
        dev_uuid = UUID(identifier)
        user = session.exec(select(User).where(User.id == dev_uuid)).first()
    except ValueError:
        user = session.exec(select(User).where(User.profile_slug == identifier)).first()
    if not user or not user.is_developer:
        raise HTTPException(status_code=404, detail="Developer not found")
    return user


def _user_to_response(user: User, session) -> DeveloperResponse:
    from datetime import datetime
    sub = session.exec(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.status == "active",
        )
    ).first()
    return DeveloperResponse(
        id=str(user.id),
        name=user.name or "Anonymous",
        avatar_url=user.avatar_url,
        profile_slug=user.profile_slug,
        bio=user.bio,
        website=user.website,
        twitter=user.twitter,
        github=user.github,
        is_verified=user.is_verified,
        is_developer=user.is_developer,
        is_pro=sub is not None,
    )


@router.get("/{identifier}", response_model=DeveloperResponse)
async def get_developer(identifier: str, session = Depends(get_session)):
    """Get developer public profile by UUID or profile slug"""
    return _user_to_response(_lookup_user(identifier, session), session)


@router.get("/{identifier}/listings", response_model=List[DeveloperListingResponse])
async def get_developer_listings(identifier: str, session = Depends(get_session)):
    """Get all approved listings by a developer"""
    user = _lookup_user(identifier, session)
    products = session.exec(
        select(Product)
        .where(Product.owner_id == user.id, Product.is_active == True)
        .order_by(Product.download_count.desc(), Product.created_at.desc())
    ).all()

    return [
        DeveloperListingResponse(
            id=str(p.id),
            slug=p.slug,
            name=p.name,
            description=p.description,
            category=p.category,
            price_cents=p.price_cents,
            is_verified=p.is_verified,
            download_count=p.download_count,
            quality_score=p.quality_score,
        )
        for p in products
    ]


@router.get("/{identifier}/stats", response_model=DeveloperStatsResponse)
async def get_developer_stats(identifier: str, session = Depends(get_session)):
    """Get developer statistics"""
    user = _lookup_user(identifier, session)

    listings_count = session.exec(
        select(func.count(Product.id)).where(Product.owner_id == user.id)
    ).first() or 0

    sales_count = session.exec(
        select(func.count(Transaction.id)).where(
            Transaction.seller_id == user.id,
            Transaction.status == "completed"
        )
    ).first() or 0

    review_stats = session.exec(
        select(func.count(Review.id), func.coalesce(func.avg(Review.rating), 0.0))
        .join(Product, Review.product_id == Product.id)
        .where(Product.owner_id == user.id)
    ).one()

    return DeveloperStatsResponse(
        total_listings=listings_count,
        total_sales=sales_count,
        average_rating=round(float(review_stats[1]), 1),
        total_reviews=review_stats[0],
    )


@router.get("/{identifier}/collections")
async def get_developer_collections(identifier: str, session = Depends(get_session)):
    """Get public collections created by a developer"""
    user = _lookup_user(identifier, session)
    collections = session.exec(
        select(Collection)
        .where(Collection.owner_id == user.id, Collection.is_public == True)
        .order_by(Collection.updated_at.desc())
    ).all()
    return [
        {"slug": c.slug, "name": c.name, "description": c.description}
        for c in collections
    ]
