from fastapi import APIRouter, HTTPException, Depends, Header
from sqlmodel import select, func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from core.database import get_session
from models import User, Product, Transaction, Review

router = APIRouter(prefix="/admin", tags=["Admin"])

# Admin email - only this user can access admin endpoints
ADMIN_EMAIL = "berkay@shopagentresources.com"

def verify_admin(authorization: Optional[str] = Header(None), session = Depends(get_session)):
    """Verify that the request is from an admin user"""
    # For now, simple check - in production, use proper JWT validation
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Extract user from token (simplified - should validate JWT properly)
    # For now, we'll check if the user exists and is the admin
    user = session.exec(select(User).where(User.email == ADMIN_EMAIL)).first()
    if not user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return user

@router.get("/dashboard")
def get_dashboard_stats(
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Get admin dashboard statistics"""
    
    # User stats
    total_users = session.exec(select(func.count(User.id))).one()
    total_developers = session.exec(select(func.count(User.id)).where(User.is_developer == True)).one()
    
    # Listing stats
    total_listings = session.exec(select(func.count(Product.id))).one()
    
    # Sales stats
    total_sales = session.exec(select(func.count(Transaction.id))).one()
    total_revenue = session.exec(select(func.sum(Transaction.amount))).one() or 0
    platform_profit = session.exec(select(func.sum(Transaction.commission))).one() or 0
    
    return {
        "stats": {
            "totalUsers": total_users,
            "totalDevelopers": total_developers,
            "totalListings": total_listings,
            "totalSales": total_sales,
            "totalRevenue": float(total_revenue),
            "platformProfit": float(platform_profit),
        }
    }

@router.get("/users")
def get_all_users(
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Get all users"""
    users = session.exec(select(User)).all()
    return [
        {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "isDeveloper": user.is_developer,
            "isVerified": user.is_verified,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
        }
        for user in users
    ]

@router.get("/developers")
def get_all_developers(
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Get all developers with their stats"""
    developers = session.exec(select(User).where(User.is_developer == True)).all()
    
    result = []
    for dev in developers:
        # Get developer's listings
        listings = session.exec(select(Product).where(Product.owner_id == dev.id)).all()
        
        # Calculate total sales and revenue
        total_sales = 0
        total_revenue = 0
        for listing in listings:
            sales = session.exec(
                select(func.count(Transaction.id), func.sum(Transaction.amount))
                .where(Transaction.product_id == listing.id)
            ).one()
            total_sales += sales[0] or 0
            total_revenue += float(sales[1] or 0)
        
        result.append({
            "id": str(dev.id),
            "name": dev.name,
            "email": dev.email,
            "listings": len(listings),
            "totalSales": total_sales,
            "revenue": total_revenue,
        })
    
    return result

@router.get("/listings")
def get_all_listings(
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Get all listings with sales stats"""
    listings = session.exec(select(Product)).all()
    
    result = []
    for listing in listings:
        # Get sales stats
        sales_data = session.exec(
            select(func.count(Transaction.id), func.sum(Transaction.amount))
            .where(Transaction.product_id == listing.id)
        ).one()
        
        sales_count = sales_data[0] or 0
        revenue = float(sales_data[1] or 0)
        profit = revenue * 0.15  # 15% commission
        
        # Get reviews
        reviews = session.exec(select(Review).where(Review.product_id == listing.id)).all()
        avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
        
        # Get developer name
        developer = session.get(User, listing.owner_id)
        
        result.append({
            "id": str(listing.id),
            "name": listing.name,
            "developer": developer.name if developer else "Unknown",
            "price": listing.price,
            "sales": sales_count,
            "revenue": revenue,
            "profit": profit,
            "reviews": len(reviews),
            "rating": round(avg_rating, 1),
            "status": listing.status,
        })
    
    return result

@router.get("/sales")
def get_all_sales(
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Get all sales transactions"""
    sales = session.exec(
        select(Transaction).order_by(Transaction.created_at.desc())
    ).all()
    
    result = []
    for sale in sales:
        # Get product name
        product = session.get(Product, sale.product_id)
        # Get buyer email
        buyer = session.get(User, sale.buyer_id)
        
        result.append({
            "id": str(sale.id),
            "item": product.name if product else "Unknown",
            "buyer": buyer.email if buyer else "Unknown",
            "amount": float(sale.amount),
            "commission": float(sale.commission),
            "date": sale.created_at.isoformat() if sale.created_at else None,
        })
    
    return result

@router.get("/sales/recent")
def get_recent_sales(
    limit: int = 10, 
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Get recent sales"""
    sales = session.exec(
        select(Transaction).order_by(Transaction.created_at.desc()).limit(limit)
    ).all()
    
    result = []
    for sale in sales:
        product = session.get(Product, sale.product_id)
        buyer = session.get(User, sale.buyer_id)
        
        result.append({
            "id": str(sale.id),
            "item": product.name if product else "Unknown",
            "buyer": buyer.email if buyer else "Unknown",
            "amount": float(sale.amount),
            "commission": float(sale.commission),
            "date": sale.created_at.strftime("%Y-%m-%d") if sale.created_at else None,
        })
    
    return result
