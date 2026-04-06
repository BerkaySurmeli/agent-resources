from fastapi import APIRouter, HTTPException, Depends, Header
from sqlmodel import select, func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from core.database import get_session
from models import User, Product, Transaction, Review, AdminUser
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Request
from pydantic import BaseModel, EmailStr
from core.config import settings
import httpx

router = APIRouter(prefix="/admin", tags=["Admin"])

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ADMIN_TOKEN_EXPIRE_DAYS = 7

# Cloudflare configuration
CLOUDFLARE_API_TOKEN = "cfat_fmsXtYHYyechjVhJam4pz4OwQmPCn7havumRcjfX3cf28199"
CLOUDFLARE_ZONE_ID = "8f1c9a67b107c9659104f8376997ba9f"

# Pydantic models
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminUserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    is_master_admin: bool

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: AdminUserResponse

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_admin_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ADMIN_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "admin"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_admin_from_token(
    request: Request,
    session = Depends(get_session)
) -> AdminUser:
    """Extract and validate admin JWT token from Authorization header"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if this is an admin token
        token_type = payload.get("type")
        if token_type != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = payload.get("sub")
        if not admin_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        admin = session.exec(select(AdminUser).where(AdminUser.id == admin_id)).first()
        
        if not admin:
            raise HTTPException(status_code=401, detail="Admin user not found")
        
        return admin
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_master_admin(
    current_admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Verify that the request is from a master admin user"""
    if not current_admin.is_master_admin:
        raise HTTPException(status_code=403, detail="Master admin access required")
    
    return current_admin

# Admin Authentication Routes
@router.post("/login", response_model=AdminLoginResponse)
def admin_login(
    login_data: AdminLoginRequest,
    session = Depends(get_session)
):
    """Login for admin users only - uses admin_users table"""
    # Find admin user
    admin = session.exec(
        select(AdminUser).where(AdminUser.email == login_data.email)
    ).first()
    
    if not admin:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(login_data.password, admin.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Update last login
    admin.last_login = datetime.utcnow()
    session.commit()
    
    # Create admin token
    access_token = create_admin_access_token({"sub": str(admin.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(admin.id),
            "email": admin.email,
            "name": admin.name,
            "is_master_admin": admin.is_master_admin
        }
    }

@router.get("/validate")
def validate_admin_token(
    request: Request,
    session = Depends(get_session)
):
    """Validate admin JWT token and return admin info"""
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if this is an admin token
        token_type = payload.get("type")
        if token_type != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_id = payload.get("sub")
        if not admin_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        admin = session.exec(select(AdminUser).where(AdminUser.id == admin_id)).first()
        
        if not admin:
            raise HTTPException(status_code=401, detail="Admin user not found")
        
        return {
            "id": str(admin.id),
            "email": admin.email,
            "name": admin.name,
            "is_master_admin": admin.is_master_admin
        }
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Admin Dashboard Routes
@router.get("/dashboard")
def get_dashboard_stats(
    session = Depends(get_session),
    admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Get admin dashboard statistics"""
    
    # User stats
    total_users = session.exec(select(func.count(User.id))).one()
    total_developers = session.exec(select(func.count(User.id)).where(User.is_developer == True)).one()
    
    # Admin stats (from admin_users table)
    total_admins = session.exec(select(func.count(AdminUser.id))).one()
    
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
    admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Get all regular users (not admins)"""
    users = session.exec(select(User)).all()
    
    def format_user(user):
        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "isDeveloper": user.is_developer,
            "isVerified": user.is_verified,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
        }
    
    return {
        "users": [format_user(u) for u in users],
    }

@router.get("/admins")
def get_all_admins(
    session = Depends(get_session),
    admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Get all admin users"""
    admins = session.exec(select(AdminUser)).all()
    
    return {
        "admins": [
            {
                "id": str(a.id),
                "email": a.email,
                "name": a.name,
                "isMasterAdmin": a.is_master_admin,
                "createdAt": a.created_at.isoformat() if a.created_at else None,
            }
            for a in admins
        ]
    }

@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    session = Depends(get_session),
    admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Delete a regular user"""
    from uuid import UUID
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user = session.get(User, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete the user
    session.delete(user)
    session.commit()
    
    return {"message": "User deleted successfully"}

@router.delete("/admins/{admin_id}")
def delete_admin(
    admin_id: str,
    session = Depends(get_session),
    current_admin: AdminUser = Depends(verify_master_admin)
):
    """Delete an admin user (master admin only, cannot delete self)"""
    from uuid import UUID
    
    try:
        admin_uuid = UUID(admin_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid admin ID")
    
    # Prevent deleting self
    if str(current_admin.id) == admin_id:
        raise HTTPException(status_code=403, detail="Cannot delete your own account")
    
    admin = session.get(AdminUser, admin_uuid)
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    # Prevent deleting the last master admin
    if admin.is_master_admin:
        master_admin_count = session.exec(
            select(func.count(AdminUser.id)).where(AdminUser.is_master_admin == True)
        ).one()
        if master_admin_count <= 1:
            raise HTTPException(status_code=403, detail="Cannot delete the last master admin")
    
    session.delete(admin)
    session.commit()
    
    return {"message": "Admin deleted successfully"}

@router.get("/developers")
def get_all_developers(
    session = Depends(get_session),
    admin: AdminUser = Depends(get_current_admin_from_token)
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
    admin: AdminUser = Depends(get_current_admin_from_token)
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
    admin: AdminUser = Depends(get_current_admin_from_token)
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
    admin: AdminUser = Depends(get_current_admin_from_token)
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
    admin: AdminUser = Depends(get_current_admin_from_token)
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
