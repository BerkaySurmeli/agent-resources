from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from sqlmodel import select, func
from typing import List, Optional
from datetime import datetime
from models import Product, Review, Transaction, User
from core.database import get_session
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/products", tags=["Products"])

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_cents: Optional[int] = None

class ProductDetailResponse(BaseModel):
    id: str
    slug: str
    name: str
    description: str
    category: str
    price_cents: int
    category_tags: List[str]
    is_active: bool
    is_verified: bool
    download_count: int
    created_at: datetime

class ReviewResponse(BaseModel):
    id: str
    rating: int
    comment: Optional[str]
    user_name: str
    created_at: datetime
    is_verified_purchase: bool

class ProductStatsResponse(BaseModel):
    total_reviews: int
    average_rating: float
    total_sales: int
    total_revenue_cents: int

class VersionResponse(BaseModel):
    id: str
    semver: str
    download_url: str
    checksum: str
    created_at: datetime
    changes: Optional[str] = None

@router.get("/{slug}", response_model=ProductDetailResponse)
async def get_product_detail(
    slug: str,
    request: Request,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get detailed product information for the owner"""
    product = session.exec(select(Product).where(Product.slug == slug)).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user is the owner
    if str(product.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view this product")

    return ProductDetailResponse(
        id=str(product.id),
        slug=product.slug,
        name=product.name,
        description=product.description or "",
        category=product.category,
        price_cents=product.price_cents,
        category_tags=product.category_tags or [],
        is_active=product.is_active,
        is_verified=product.is_verified,
        download_count=product.download_count,
        created_at=product.created_at
    )

@router.put("/{slug}", response_model=ProductDetailResponse)
async def update_product(
    slug: str,
    update_data: ProductUpdate,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Update product details"""
    product = session.exec(select(Product).where(Product.slug == slug)).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user is the owner
    if str(product.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to update this product")

    # Update fields
    if update_data.name is not None:
        product.name = update_data.name
    if update_data.description is not None:
        product.description = update_data.description
    if update_data.price_cents is not None:
        product.price_cents = update_data.price_cents

    session.commit()
    session.refresh(product)

    return ProductDetailResponse(
        id=str(product.id),
        slug=product.slug,
        name=product.name,
        description=product.description or "",
        category=product.category,
        price_cents=product.price_cents,
        category_tags=product.category_tags or [],
        is_active=product.is_active,
        is_verified=product.is_verified,
        download_count=product.download_count,
        created_at=product.created_at
    )

@router.get("/{slug}/reviews", response_model=List[ReviewResponse])
async def get_product_reviews(
    slug: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get all reviews for a product (owner only)"""
    product = session.exec(select(Product).where(Product.slug == slug)).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user is the owner
    if str(product.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view these reviews")

    reviews = session.exec(
        select(Review, User)
        .join(User, Review.user_id == User.id, isouter=True)
        .where(Review.product_id == product.id)
        .order_by(Review.created_at.desc())
    ).all()

    return [
        ReviewResponse(
            id=str(review.id),
            rating=review.rating,
            comment=review.comment,
            user_name=user.name if user else "Anonymous",
            created_at=review.created_at,
            is_verified_purchase=review.is_verified_purchase
        )
        for review, user in reviews
    ]

@router.get("/{slug}/stats", response_model=ProductStatsResponse)
async def get_product_stats(
    slug: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get product statistics (owner only)"""
    product = session.exec(select(Product).where(Product.slug == slug)).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user is the owner
    if str(product.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to view these stats")

    # Get review stats
    review_stats = session.exec(
        select(func.count(Review.id), func.avg(Review.rating))
        .where(Review.product_id == product.id)
    ).first()

    total_reviews = review_stats[0] if review_stats else 0
    average_rating = float(review_stats[1]) if review_stats and review_stats[1] else 0.0

    # Get sales stats
    sales_stats = session.exec(
        select(func.count(Transaction.id), func.sum(Transaction.amount_cents))
        .where(
            Transaction.product_id == product.id,
            Transaction.status == "completed"
        )
    ).first()

    total_sales = sales_stats[0] if sales_stats else 0
    total_revenue_cents = int(sales_stats[1]) if sales_stats and sales_stats[1] else 0

    return ProductStatsResponse(
        total_reviews=total_reviews,
        average_rating=average_rating,
        total_sales=total_sales,
        total_revenue_cents=total_revenue_cents
    )

@router.post("/{slug}/reviews")
async def create_review(
    slug: str,
    rating: int,
    comment: Optional[str] = None,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Create a review for a product"""
    if not 1 <= rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    product = session.exec(select(Product).where(Product.slug == slug)).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user already reviewed this product
    existing = session.exec(
        select(Review)
        .where(Review.product_id == product.id, Review.user_id == current_user.id)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this product")

    # Check if user purchased this product
    purchase = session.exec(
        select(Transaction)
        .where(
            Transaction.product_id == product.id,
            Transaction.buyer_id == current_user.id,
            Transaction.status == "completed"
        )
    ).first()

    review = Review(
        user_id=current_user.id,
        product_id=product.id,
        rating=rating,
        comment=comment,
        is_verified_purchase=purchase is not None
    )

    session.add(review)
    session.commit()

    return {"message": "Review created successfully", "review_id": str(review.id)}


@router.delete("/{slug}")
async def delete_product(
    slug: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Delete a product (owner only)"""
    product = session.exec(select(Product).where(Product.slug == slug)).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user is the owner
    if str(product.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")

    # Delete associated reviews first (FK constraint)
    reviews = session.exec(select(Review).where(Review.product_id == product.id)).all()
    for review in reviews:
        session.delete(review)

    # Delete the product
    session.delete(product)
    session.commit()

    return {"message": "Product deleted successfully"}


@router.post("/{slug}/toggle-status", response_model=ProductDetailResponse)
async def toggle_product_status(
    slug: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Toggle product active status (owner only)"""
    product = session.exec(select(Product).where(Product.slug == slug)).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user is the owner
    if str(product.owner_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to modify this product")

    # Toggle status
    product.is_active = not product.is_active
    session.commit()
    session.refresh(product)

    return ProductDetailResponse(
        id=str(product.id),
        slug=product.slug,
        name=product.name,
        description=product.description or "",
        category=product.category,
        price_cents=product.price_cents,
        category_tags=product.category_tags or [],
        is_active=product.is_active,
        is_verified=product.is_verified,
        download_count=product.download_count,
        created_at=product.created_at
    )


@router.get("/{slug}/versions", response_model=List[VersionResponse])
async def get_product_versions(
    slug: str,
    session = Depends(get_session)
):
    """Get version history for a product"""
    from models import Version

    product = session.exec(select(Product).where(Product.slug == slug)).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    versions = session.exec(
        select(Version)
        .where(Version.product_id == product.id)
        .order_by(Version.created_at.desc())
    ).all()

    return [
        VersionResponse(
            id=str(v.id),
            semver=v.semver,
            download_url=v.download_url,
            checksum=v.checksum,
            created_at=v.created_at,
            changes=v.compatibility_matrix.get("changes") if v.compatibility_matrix else None
        )
        for v in versions
    ]
