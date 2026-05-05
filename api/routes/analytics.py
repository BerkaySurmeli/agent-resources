from fastapi import APIRouter, Depends
from sqlmodel import select, func
from sqlalchemy import text
from typing import List
from models import User, Product, Transaction, Review
from core.database import get_session
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post("/listings/{slug}/view")
async def record_view(slug: str, session = Depends(get_session)):
    """Increment view count for a listing (called client-side on page load)."""
    session.exec(
        text("UPDATE products SET view_count = view_count + 1 WHERE slug = :slug"),
        {"slug": slug}
    )
    session.commit()
    return {"ok": True}


@router.get("/seller")
async def get_seller_analytics(
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Return per-listing analytics for the authenticated seller."""
    products = session.exec(
        select(Product).where(Product.owner_id == current_user.id, Product.is_active == True)
    ).all()

    if not products:
        return {"listings": [], "totals": {"views": 0, "sales": 0, "revenue_cents": 0}}

    product_ids = [p.id for p in products]

    # Sales + revenue per product
    sales_rows = session.exec(
        select(Transaction.product_id, func.count(Transaction.id), func.sum(Transaction.amount_cents))
        .where(Transaction.product_id.in_(product_ids), Transaction.status == "completed")
        .group_by(Transaction.product_id)
    ).all()
    sales_map = {str(row[0]): {"sales": row[1], "revenue_cents": int(row[2] or 0)} for row in sales_rows}

    # Avg rating + review count per product
    review_rows = session.exec(
        select(Review.product_id, func.count(Review.id), func.coalesce(func.avg(Review.rating), 0.0))
        .where(Review.product_id.in_(product_ids))
        .group_by(Review.product_id)
    ).all()
    review_map = {str(row[0]): {"review_count": row[1], "avg_rating": round(float(row[2]), 1)} for row in review_rows}

    listings_out = []
    for p in products:
        pid = str(p.id)
        s = sales_map.get(pid, {"sales": 0, "revenue_cents": 0})
        r = review_map.get(pid, {"review_count": 0, "avg_rating": 0.0})
        views = p.view_count or 0
        sales = s["sales"]
        conversion = round((sales / views * 100), 1) if views > 0 else 0.0
        listings_out.append({
            "slug": p.slug,
            "name": p.name,
            "category": p.category,
            "price_cents": p.price_cents,
            "views": views,
            "sales": sales,
            "revenue_cents": s["revenue_cents"],
            "conversion_rate": conversion,
            "avg_rating": r["avg_rating"],
            "review_count": r["review_count"],
            "download_count": p.download_count,
        })

    totals = {
        "views": sum(l["views"] for l in listings_out),
        "sales": sum(l["sales"] for l in listings_out),
        "revenue_cents": sum(l["revenue_cents"] for l in listings_out),
    }

    return {"listings": listings_out, "totals": totals}
