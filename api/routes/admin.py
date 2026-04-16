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

# Cloudflare configuration - read from environment variables
CLOUDFLARE_API_TOKEN = settings.CLOUDFLARE_API_TOKEN
CLOUDFLARE_ZONE_ID = settings.CLOUDFLARE_ZONE_ID

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
    # First check if this email belongs to a regular user - they cannot use admin login
    regular_user = session.exec(select(User).where(User.email == login_data.email)).first()
    if regular_user:
        raise HTTPException(status_code=400, detail="Regular users cannot access admin login. Please use the regular login page.")
    
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
    """Delete a regular user - cannot delete admin users"""
    from uuid import UUID
    
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user = session.get(User, user_uuid)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if this email is also an admin - cannot delete admin users via this endpoint
    admin_check = session.exec(select(AdminUser).where(AdminUser.email == user.email)).first()
    if admin_check:
        raise HTTPException(status_code=403, detail="Cannot delete admin users from the users endpoint. Use the admin management endpoint.")
    
    # Delete the user
    session.delete(user)
    session.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/cleanup-test-users")
def cleanup_test_users(
    session = Depends(get_session),
    admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Delete test users from database (test@example.com, test6@example.com, etc.)"""
    from models import Listing, Product, Transaction, Review, ListingTranslation
    
    # Patterns for test emails
    test_email_patterns = ['test@example.com', 'test%', '%@test.com', '%test%', 'demo@%', 'fake@%']
    
    deleted_count = 0
    deleted_users = []
    
    # Find test users
    test_users = session.exec(
        select(User).where(
            User.email.ilike('test@example.com') |
            User.email.ilike('test%@example.com') |
            User.email.ilike('test%@%') |
            User.email.ilike('%test%@%') |
            User.email.ilike('demo@%') |
            User.email.ilike('fake@%')
        )
    ).all()
    
    for user in test_users:
        # Skip if user is also an admin
        admin_check = session.exec(select(AdminUser).where(AdminUser.email == user.email)).first()
        if admin_check:
            continue
        
        try:
            user_id = user.id
            user_email = user.email
            
            # Delete user's reviews
            reviews = session.exec(select(Review).where(Review.user_id == user_id)).all()
            for review in reviews:
                session.delete(review)
            
            # Delete user's listings and their translations
            listings = session.exec(select(Listing).where(Listing.owner_id == user_id)).all()
            for listing in listings:
                translations = session.exec(select(ListingTranslation).where(ListingTranslation.listing_id == listing.id)).all()
                for t in translations:
                    session.delete(t)
                session.delete(listing)
            
            # Delete user's products
            products = session.exec(select(Product).where(Product.owner_id == user_id)).all()
            for product in products:
                session.delete(product)
            
            # Anonymize transactions
            transactions = session.exec(
                select(Transaction).where(
                    (Transaction.buyer_id == user_id) | (Transaction.seller_id == user_id)
                )
            ).all()
            for t in transactions:
                if t.buyer_id == user_id:
                    t.buyer_id = None
                if t.seller_id == user_id:
                    t.seller_id = None
            
            # Delete the user
            session.delete(user)
            deleted_count += 1
            deleted_users.append(user_email)
            
        except Exception as e:
            print(f"[CLEANUP ERROR] Failed to delete user {user.email}: {e}")
            continue
    
    session.commit()
    
    return {
        "message": f"Deleted {deleted_count} test users",
        "deleted_users": deleted_users
    }


@router.post("/cleanup-duplicate-listings")
def cleanup_duplicate_listings(
    session = Depends(get_session),
    admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Consolidate duplicate listings (e.g., multiple 'Claudia' listings)"""
    from collections import defaultdict
    from models import ListingTranslation
    
    # Get all listings
    all_listings = session.exec(select(Listing)).all()
    
    # Group by slug base (without numeric suffixes)
    slug_groups = defaultdict(list)
    for listing in all_listings:
        # Get base slug (remove -1, -2, etc. suffixes)
        base_slug = listing.slug
        if '-' in listing.slug:
            parts = listing.slug.rsplit('-', 1)
            if parts[1].isdigit():
                base_slug = parts[0]
        slug_groups[base_slug].append(listing)
    
    deleted_count = 0
    kept_listings = []
    
    for base_slug, listings in slug_groups.items():
        if len(listings) > 1:
            # Sort by creation date, keep the oldest one
            listings.sort(key=lambda x: x.created_at or datetime.min)
            keep_listing = listings[0]
            duplicates = listings[1:]
            
            kept_listings.append({
                "slug": keep_listing.slug,
                "name": keep_listing.name,
                "duplicates_removed": len(duplicates)
            })
            
            for dup in duplicates:
                try:
                    # Delete translations
                    translations = session.exec(select(ListingTranslation).where(ListingTranslation.listing_id == dup.id)).all()
                    for t in translations:
                        session.delete(t)
                    
                    session.delete(dup)
                    deleted_count += 1
                except Exception as e:
                    print(f"[CLEANUP ERROR] Failed to delete duplicate listing {dup.slug}: {e}")
                    continue
    
    session.commit()
    
    return {
        "message": f"Removed {deleted_count} duplicate listings",
        "kept_listings": kept_listings
    }

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

# Cache for Cloudflare metrics (5 minute TTL)
_cloudflare_metrics_cache = {
    "data": None,
    "timestamp": None
}

@router.get("/metrics/cloudflare")
async def get_cloudflare_metrics(
    session = Depends(get_session),
    admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Get Cloudflare analytics metrics - returns demo data if API token lacks permissions"""
    global _cloudflare_metrics_cache
    
    now = datetime.utcnow()
    
    # Check cache (5 minute TTL)
    cache_ttl = 300  # 5 minutes
    if (_cloudflare_metrics_cache["data"] and 
        _cloudflare_metrics_cache["timestamp"] and 
        (now - _cloudflare_metrics_cache["timestamp"]).seconds < cache_ttl):
        print("[CLOUDFLARE] Returning cached metrics")
        cached_data = _cloudflare_metrics_cache["data"].copy()
        cached_data["cached"] = True
        cached_data["cacheAge"] = (now - _cloudflare_metrics_cache["timestamp"]).seconds
        return cached_data
    
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/json"
            }
            
            # Try GraphQL API first
            graphql_query = {
                "query": """
                    query GetZoneAnalytics($zoneId: String!, $since: Time!, $until: Time!) {
                        viewer {
                            zones(filter: { zoneTag: $zoneId }) {
                                httpRequests1dGroups(
                                    limit: 1
                                    filter: { date_geq: $since, date_leq: $until }
                                ) {
                                    dimensions { date }
                                    sum { requests bytes cachedBytes threats pageViews }
                                    uniq { uniques }
                                }
                            }
                        }
                    }
                """,
                "variables": {
                    "zoneId": CLOUDFLARE_ZONE_ID,
                    "since": (now - timedelta(days=30)).strftime("%Y-%m-%d"),
                    "until": now.strftime("%Y-%m-%d")
                }
            }
            
            response = await client.post(
                "https://api.cloudflare.com/client/v4/graphql",
                headers=headers,
                json=graphql_query,
                timeout=30.0
            )
            
            data = response.json()
            
            # Check for auth errors - return demo data with message
            if (response.status_code != 200 or 
                data.get("errors") or 
                not data.get("data", {}).get("viewer", {}).get("zones", [])):
                
                print(f"[CLOUDFLARE] API error or no data, returning demo data")
                
                demo_data = {
                    "requests": 2847,
                    "bandwidth": 152345678,
                    "pageviews": 1923,
                    "threats": 3,
                    "uniqueVisitors": 456,
                    "period": "30 days",
                    "lastUpdated": now.isoformat(),
                    "cached": False,
                    "demo": True,
                    "message": "Demo data - Cloudflare API token needs Zone Analytics permissions. To fix: Go to Cloudflare dashboard → My Profile → API Tokens → Edit your token → Add 'Zone Analytics:Read' permission."
                }
                
                # Cache demo data too
                _cloudflare_metrics_cache["data"] = demo_data.copy()
                _cloudflare_metrics_cache["timestamp"] = now
                
                return demo_data
            
            # Extract data from GraphQL response
            zones = data.get("data", {}).get("viewer", {}).get("zones", [])
            if not zones or not zones[0].get("httpRequests1dGroups"):
                return {
                    "requests": 0,
                    "bandwidth": 0,
                    "pageviews": 0,
                    "threats": 0,
                    "uniqueVisitors": 0,
                    "period": "30 days",
                    "lastUpdated": now.isoformat(),
                    "cached": False,
                    "note": "No analytics data available for this period"
                }
            
            # Sum up the data from all days
            total_requests = 0
            total_bandwidth = 0
            total_pageviews = 0
            total_threats = 0
            total_uniques = 0
            
            for group in zones[0]["httpRequests1dGroups"]:
                sum_data = group.get("sum", {})
                total_requests += sum_data.get("requests", 0)
                total_bandwidth += sum_data.get("bytes", 0)
                total_pageviews += sum_data.get("pageViews", 0)
                total_threats += sum_data.get("threats", 0)
                total_uniques += group.get("uniq", {}).get("uniques", 0)
            
            metrics_data = {
                "requests": total_requests,
                "bandwidth": total_bandwidth,
                "pageviews": total_pageviews,
                "threats": total_threats,
                "uniqueVisitors": total_uniques,
                "period": "30 days",
                "lastUpdated": now.isoformat(),
                "cached": False
            }
            
            # Update cache
            _cloudflare_metrics_cache["data"] = metrics_data.copy()
            _cloudflare_metrics_cache["timestamp"] = now
            
            return metrics_data
            
    except Exception as e:
        print(f"[CLOUDFLARE] Error: {e}")
        # Return demo data on any error
        demo_data = {
            "requests": 2847,
            "bandwidth": 152345678,
            "pageviews": 1923,
            "threats": 3,
            "uniqueVisitors": 456,
            "period": "30 days",
            "lastUpdated": now.isoformat(),
            "cached": False,
            "demo": True,
            "message": "Demo data - Cloudflare API token needs Zone Analytics permissions. To fix: Go to Cloudflare dashboard → My Profile → API Tokens → Edit your token → Add 'Zone Analytics:Read' permission."
        }
        
        _cloudflare_metrics_cache["data"] = demo_data.copy()
        _cloudflare_metrics_cache["timestamp"] = now
        
        return demo_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching metrics: {str(e)}")


@router.post("/run-migration")
async def run_migration(request: Request, session=Depends(get_session)):
    """Run database migrations - adds missing columns"""
    from sqlalchemy import text
    
    try:
        # Check if column exists
        result = session.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'became_developer_at'
        """))
        
        if result.fetchone():
            return {"status": "already_exists", "message": "Column 'became_developer_at' already exists"}
        
        # Add the column
        session.execute(text("""
            ALTER TABLE users 
            ADD COLUMN became_developer_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
        """))
        session.commit()
        
        return {"status": "success", "message": "Added 'became_developer_at' column to users table"}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


# Temporary endpoint to create/reset admin - remove after use
@router.post("/setup-admin")
def setup_admin(
    setup_key: str = Header(...),
    email: str = "admin@shopagentresources.com",
    password: str = "admin123!",
    name: str = "Admin"
):
    """Create or reset admin user - requires setup key from environment"""
    from core.config import settings
    from sqlmodel import Session, create_engine
    from uuid import uuid4
    
    # Verify setup key
    expected_key = getattr(settings, 'ADMIN_SETUP_KEY', 'dev-setup-key-12345')
    if setup_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    # Create engine inline
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as session:
        # Check if admin exists
        admin = session.exec(select(AdminUser).where(AdminUser.email == email)).first()
        
        if admin:
            # Reset password
            admin.password_hash = pwd_context.hash(password)
            admin.name = name
            session.commit()
            return {"message": f"Admin {email} password reset successfully"}
        else:
            # Create new admin
            admin = AdminUser(
                id=uuid4(),
                email=email,
                password_hash=pwd_context.hash(password),
                name=name,
                is_master_admin=True
            )
            session.add(admin)
            session.commit()
            return {"message": f"Admin {email} created successfully"}


@router.post("/seed-mcp-servers")
async def seed_mcp_servers(
    setup_key: str = Header(..., alias="X-Setup-Key"),
    session = Depends(get_session)
):
    """Seed MCP server listings - requires setup key"""
    from core.config import settings
    
    # Verify setup key
    expected_key = getattr(settings, 'ADMIN_SETUP_KEY', 'dev-setup-key-12345')
    if setup_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    import uuid
    from models import Listing
    
    # MCP Server data
    MCP_SERVERS = [
        {"name": "GitHub MCP Server", "slug": "mcp-github", "description": "Create repos, manage issues, review PRs, and search code. Full GitHub integration for your AI agents.", "category": "mcp_server", "price_cents": 99, "tags": ["development", "github", "version-control"]},
        {"name": "Slack MCP Server", "slug": "mcp-slack", "description": "Send messages, manage channels, and search conversations. Keep your team in the loop.", "category": "mcp_server", "price_cents": 99, "tags": ["communication", "slack", "messaging"]},
        {"name": "Notion MCP Server", "slug": "mcp-notion", "description": "Create pages, manage databases, and search your workspace. Perfect for documentation and knowledge management.", "category": "mcp_server", "price_cents": 99, "tags": ["productivity", "notion", "documentation"]},
        {"name": "Linear MCP Server", "slug": "mcp-linear", "description": "Create issues, manage projects, and track progress. Streamline your project management workflow.", "category": "mcp_server", "price_cents": 99, "tags": ["project-management", "linear", "issues"]},
        {"name": "PostgreSQL MCP Server", "slug": "mcp-postgres", "description": "Query databases, analyze data, and generate reports. Connect your agents to your data.", "category": "mcp_server", "price_cents": 99, "tags": ["database", "postgresql", "sql"]},
        {"name": "Puppeteer MCP Server", "slug": "mcp-puppeteer", "description": "Web scraping, screenshots, and browser automation. Extract data from any website.", "category": "mcp_server", "price_cents": 99, "tags": ["automation", "web-scraping", "browser"]},
        {"name": "File System MCP Server", "slug": "mcp-filesystem", "description": "Read, write, and manage files with intelligent search. Local file operations for your agents.", "category": "mcp_server", "price_cents": 99, "tags": ["utilities", "files", "storage"]},
        {"name": "Fetch MCP Server", "slug": "mcp-fetch", "description": "Make HTTP requests and fetch data from any API. Universal API integration.", "category": "mcp_server", "price_cents": 99, "tags": ["utilities", "http", "api"]},
        {"name": "Brave Search MCP Server", "slug": "mcp-brave", "description": "Web search with privacy-focused results. Search the web without tracking.", "category": "mcp_server", "price_cents": 99, "tags": ["research", "search", "web"]},
        {"name": "Weather MCP Server", "slug": "mcp-weather", "description": "Get current weather and forecasts for any location. Perfect for travel and planning.", "category": "mcp_server", "price_cents": 99, "tags": ["utilities", "weather", "location"]},
        {"name": "Google Calendar MCP Server", "slug": "mcp-calendar", "description": "Schedule meetings, check availability, manage events. Time management for your agents.", "category": "mcp_server", "price_cents": 99, "tags": ["productivity", "calendar", "scheduling"]},
        {"name": "Gmail MCP Server", "slug": "mcp-gmail", "description": "Send emails, search inbox, manage labels. Email automation for your workflow.", "category": "mcp_server", "price_cents": 99, "tags": ["communication", "email", "gmail"]},
    ]
    
    # Find first verified user to be owner
    from models import User
    owner = session.exec(select(User).where(User.is_verified == True)).first()
    
    if not owner:
        raise HTTPException(status_code=400, detail="No verified user found to own listings")
    
    created = 0
    skipped = 0
    
    for mcp_data in MCP_SERVERS:
        existing = session.exec(select(Listing).where(Listing.slug == mcp_data["slug"])).first()
        if existing:
            skipped += 1
            continue
        
        listing = Listing(
            id=uuid.uuid4(),
            owner_id=owner.id,
            name=mcp_data["name"],
            slug=mcp_data["slug"],
            description=mcp_data["description"],
            category=mcp_data["category"],
            price_cents=mcp_data["price_cents"],
            category_tags=mcp_data["tags"],
            file_path=f"/tmp/mcp-{mcp_data['slug']}.zip",
            file_size_bytes=1024,
            file_count=1,
            original_language='en',
            listing_fee_cents=0,
            status='approved',
            virus_scan_status='clean',
            translation_status='completed',
        )
        session.add(listing)
        created += 1
    
    session.commit()
    return {"created": created, "skipped": skipped, "owner": owner.email}


@router.post("/migrate")
async def run_migration(
    setup_key: str = Header(..., alias="X-Setup-Key"),
    session = Depends(get_session)
):
    """Run database migrations - requires setup key"""
    from core.config import settings
    from sqlalchemy import text
    
    expected_key = getattr(settings, 'ADMIN_SETUP_KEY', 'dev-setup-key-12345')
    if setup_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    try:
        # Add version column
        session.exec(text("ALTER TABLE listings ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0'"))
        
        # Add scan_progress column
        session.exec(text("ALTER TABLE listings ADD COLUMN IF NOT EXISTS scan_progress INTEGER DEFAULT 0"))
        
        # Add translation_progress column
        session.exec(text("ALTER TABLE listings ADD COLUMN IF NOT EXISTS translation_progress INTEGER DEFAULT 0"))
        
        # Change virustotal_report to JSONB if it's still TEXT/VARCHAR
        try:
            session.exec(text("ALTER TABLE listings ALTER COLUMN virustotal_report TYPE JSONB USING virustotal_report::JSONB"))
        except Exception as e:
            print(f"[MIGRATION] Could not convert virustotal_report to JSONB (may already be JSON or have data issues): {e}")
            # Try to drop and recreate as JSONB if conversion fails
            try:
                session.exec(text("ALTER TABLE listings ALTER COLUMN virustotal_report DROP DEFAULT"))
                session.exec(text("ALTER TABLE listings ALTER COLUMN virustotal_report TYPE JSONB USING NULL"))
            except Exception as e2:
                print(f"[MIGRATION] Fallback also failed: {e2}")
        
        session.commit()
        return {"message": "Migration completed successfully"}
    except Exception as e:
        session.rollback()
        return {"error": str(e)}


@router.post("/approve-listing/{listing_id}")
async def approve_listing_manual(
    listing_id: str,
    setup_key: str = Header(None),
    session = Depends(get_session)
):
    """Manually approve a stuck listing"""
    from models import Listing, Product
    import uuid
    
    # Verify setup key
    expected_key = getattr(settings, 'ADMIN_SETUP_KEY', 'dev-setup-key-12345')
    if setup_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    try:
        # Get the listing
        listing = session.exec(select(Listing).where(Listing.id == uuid.UUID(listing_id))).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Approve the listing
        listing.status = 'approved'
        listing.virus_scan_status = 'clean'
        listing.scan_completed_at = datetime.utcnow()
        listing.scan_results = {
            "virustotal": {"status": "clean", "source": "manual"},
            "openclaw_analysis": {"status": "passed"}
        }
        
        # Create product from listing
        product = Product(
            owner_id=listing.owner_id,
            name=listing.name,
            slug=listing.slug,
            description=listing.description,
            category=listing.category.value,
            category_tags=listing.category_tags,
            price_cents=listing.price_cents,
            is_active=True,
            is_verified=True
        )
        session.add(product)
        session.commit()
        session.refresh(product)
        
        listing.product_id = product.id
        session.commit()
        
        return {
            "message": "Listing approved successfully",
            "listing_id": str(listing.id),
            "product_id": str(product.id)
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
