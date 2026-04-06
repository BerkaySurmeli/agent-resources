from fastapi import APIRouter, HTTPException, Depends, Header
from sqlmodel import select, func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from core.database import get_session
from models import User, Product, Transaction, Review
import httpx

router = APIRouter(prefix="/admin", tags=["Admin"])

# Admin email - only this user can access admin endpoints
ADMIN_EMAIL = "berkay@shopagentresources.com"

# Cloudflare configuration
CLOUDFLARE_API_TOKEN = "cfat_fmsXtYHYyechjVhJam4pz4OwQmPCn7havumRcjfX3cf28199"
CLOUDFLARE_ZONE_ID = "8f1c9a67b107c9659104f8376997ba9f"

def verify_admin(session = Depends(get_session)):
    """Verify that the request is from an admin user"""
    # For now, check if admin user exists in database
    # In production, validate JWT token properly
    user = session.exec(select(User).where(User.email == ADMIN_EMAIL)).first()
    if not user:
        raise HTTPException(status_code=403, detail="Admin user not found")
    
    return user

def verify_master_admin(session = Depends(get_session)):
    """Verify that the request is from a master admin user"""
    user = session.exec(select(User).where(User.email == ADMIN_EMAIL, User.is_master_admin == True)).first()
    if not user:
        raise HTTPException(status_code=403, detail="Master admin access required")
    
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
    total_admins = session.exec(select(func.count(User.id)).where(User.is_admin == True)).one()
    
    # Listing stats
    total_listings = session.exec(select(func.count(Product.id))).one()
    
    # Sales stats
    total_sales = session.exec(select(func.count(Transaction.id))).one()
    total_revenue = session.exec(select(func.sum(Transaction.amount_cents))).one() or 0
    platform_profit = session.exec(select(func.sum(Transaction.platform_fee_cents))).one() or 0
    
    return {
        "stats": {
            "totalUsers": total_users,
            "totalDevelopers": total_developers,
            "totalAdmins": total_admins,
            "totalListings": total_listings,
            "totalSales": total_sales,
            "totalRevenue": float(total_revenue) / 100,  # Convert cents to dollars
            "platformProfit": float(platform_profit) / 100,
        }
    }

@router.get("/users")
def get_all_users(
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Get all users separated by type"""
    # Regular users (not admins)
    regular_users = session.exec(select(User).where(User.is_admin == False)).all()
    
    # Admin users
    admin_users = session.exec(select(User).where(User.is_admin == True)).all()
    
    def format_user(user):
        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "isDeveloper": user.is_developer,
            "isVerified": user.is_verified,
            "isAdmin": user.is_admin,
            "isMasterAdmin": user.is_master_admin,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
        }
    
    return {
        "regularUsers": [format_user(u) for u in regular_users],
        "adminUsers": [format_user(u) for u in admin_users],
    }

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Delete a user (master admin cannot be deleted)"""
    from uuid import UUID
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user = session.get(User, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deletion of master admin
    if user.is_master_admin:
        raise HTTPException(status_code=403, detail="Cannot delete master admin user")
    
    # Prevent admins from deleting other admins (only master admin can)
    if user.is_admin and not admin.is_master_admin:
        raise HTTPException(status_code=403, detail="Only master admin can delete admin users")
    
    # Delete the user
    session.delete(user)
    session.commit()
    
    return {"message": "User deleted successfully"}

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
                select(func.count(Transaction.id), func.sum(Transaction.amount_cents))
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
            "revenue": total_revenue / 100,  # Convert cents to dollars
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
            select(func.count(Transaction.id), func.sum(Transaction.amount_cents))
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
            "price": listing.price_cents / 100,  # Convert cents to dollars
            "sales": sales_count,
            "revenue": revenue / 100,
            "profit": profit / 100,
            "reviews": len(reviews),
            "rating": round(avg_rating, 1),
            "status": "active" if listing.is_active else "inactive",
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
            "amount": float(sale.amount_cents) / 100,
            "commission": float(sale.platform_fee_cents) / 100,
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
            "amount": float(sale.amount_cents) / 100,
            "commission": float(sale.platform_fee_cents) / 100,
            "date": sale.created_at.strftime("%Y-%m-%d") if sale.created_at else None,
        })
    
    return result

@router.get("/metrics/cloudflare")
async def get_cloudflare_metrics(
    session = Depends(get_session),
    admin: User = Depends(verify_admin)
):
    """Get Cloudflare analytics metrics"""
    try:
        async with httpx.AsyncClient() as client:
            # Get zone analytics
            headers = {
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/json"
            }
            
            # Get analytics data for the last 30 days
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            # Fetch analytics data
            analytics_url = f"https://api.cloudflare.com/client/v4/zones/{CLOUDFLARE_ZONE_ID}/analytics/dashboard"
            
            response = await client.get(analytics_url, headers=headers, timeout=30.0)
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Cloudflare API error: {response.text}")
            
            data = response.json()
            
            if not data.get("success"):
                raise HTTPException(status_code=500, detail=f"Cloudflare API error: {data.get('errors')}")
            
            result = data.get("result", {})
            timeseries = result.get("timeseries", [])
            
            # Calculate totals from timeseries
            total_requests = sum(t.get("requests", {}).get("all", 0) for t in timeseries)
            total_bandwidth = sum(t.get("bandwidth", {}).get("all", 0) for t in timeseries)
            total_pageviews = sum(t.get("pageviews", {}).get("all", 0) for t in timeseries)
            total_threats = sum(t.get("threats", {}).get("all", 0) for t in timeseries)
            
            # Get unique visitors (estimated from uniques if available)
            unique_visitors = timeseries[-1].get("uniques", {}).get("all", 0) if timeseries else 0
            
            return {
                "requests": total_requests,
                "bandwidth": total_bandwidth,
                "pageviews": total_pageviews,
                "threats": total_threats,
                "uniqueVisitors": unique_visitors,
                "period": "30 days",
                "lastUpdated": datetime.utcnow().isoformat()
            }
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch Cloudflare metrics: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metrics: {str(e)}")

@router.post("/restore-admin")
def restore_admin_user(
    session = Depends(get_session),
    master_admin: User = Depends(verify_master_admin)
):
    """Restore the master admin user if deleted"""
    # Check if admin user exists
    admin_user = session.exec(select(User).where(User.email == ADMIN_EMAIL)).first()
    
    if admin_user:
        # Ensure it's marked as master admin
        if not admin_user.is_master_admin:
            admin_user.is_master_admin = True
            admin_user.is_admin = True
            session.commit()
            return {"message": "Admin user restored to master admin status"}
        return {"message": "Admin user already exists and is master admin"}
    
    # Create new master admin user (would need password setup)
    # This is a placeholder - in production you'd want a secure way to set the password
    raise HTTPException(status_code=404, detail="Admin user not found. Please create the admin user manually.")
