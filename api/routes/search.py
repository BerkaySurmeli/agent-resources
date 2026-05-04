from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlmodel import select, or_, func  # or_ used for product search
from typing import List
from models import Product, User
from core.database import get_session

router = APIRouter(prefix="/search", tags=["Search"])

class SearchResult(BaseModel):
    type: str  # 'product', 'developer'
    id: str
    name: str
    slug: str
    description: str | None
    category: str | None
    price_cents: int | None
    avatar_url: str | None
    is_verified: bool

@router.get("/", response_model=List[SearchResult])
async def global_search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=50),
    session = Depends(get_session)
):
    """Global search across products and developers"""
    if not q or len(q.strip()) < 1:
        return []

    query = q.strip().lower()
    results = []

    # Search products
    products = session.exec(
        select(Product)
        .where(
            Product.is_active == True,
            or_(
                func.lower(Product.name).contains(query),
                func.lower(Product.description).contains(query),
                func.lower(Product.category).contains(query)
            )
        )
        .limit(limit)
    ).all()

    for product in products:
        results.append(SearchResult(
            type='product',
            id=str(product.id),
            name=product.name,
            slug=product.slug,
            description=product.description[:100] + '...' if product.description and len(product.description) > 100 else product.description,
            category=product.category,
            price_cents=product.price_cents,
            avatar_url=None,
            is_verified=product.is_verified
        ))

    # Search developers (limit to remaining slots)
    remaining = limit - len(results)
    if remaining > 0:
        developers = session.exec(
            select(User)
            .where(
                User.is_developer == True,
                func.lower(User.name).contains(query)
            )
            .limit(remaining)
        ).all()

        for dev in developers:
            results.append(SearchResult(
                type='developer',
                id=str(dev.id),
                name=dev.name or 'Anonymous',
                slug=str(dev.id),
                description=None,
                category=None,
                price_cents=None,
                avatar_url=dev.avatar_url,
                is_verified=dev.is_verified
            ))

    return results
