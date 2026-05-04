from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import select
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from collections import defaultdict
import time
from core.database import get_session
from core.config import settings
from models import User, AdminUser
from services.email import send_verification_email, EmailService

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory rate limiter: max 10 attempts per IP per 15 minutes
_rate_store: dict = defaultdict(list)
_RATE_WINDOW = 900  # seconds
_RATE_MAX = 10

def _check_rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    attempts = _rate_store[ip]
    # Drop expired entries
    _rate_store[ip] = [t for t in attempts if now - t < _RATE_WINDOW]
    if len(_rate_store[ip]) >= _RATE_MAX:
        raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")
    _rate_store[ip].append(now)

# Security - use argon2 which doesn't have the 72-byte limit
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Pydantic models
class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(max_length=128)

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

from typing import Optional

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    is_developer: bool
    avatar_url: Optional[str]
    is_verified: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Handle CORS preflight
@router.options("/signup")
@router.options("/login")
def auth_options():
    return {"message": "OK"}


# Dependency to get current user from JWT token - defined before routes that use it
def get_current_user_from_token(
    request: Request,
    session = Depends(get_session)
) -> User:
    """Extract and validate JWT token from Authorization header"""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = session.exec(select(User).where(User.id == user_id)).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@router.post("/signup", response_model=TokenResponse)
def signup(request: Request, user_data: UserSignup, session = Depends(get_session)):
    _check_rate_limit(request)
    try:
        # Check if user exists
        existing = session.exec(select(User).where(User.email == user_data.email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password
        hashed = get_password_hash(user_data.password)

        # Generate verification token
        import secrets
        verification_token = secrets.token_urlsafe(32)

        # Check if email is in waitlist with developer code
        from models import WaitlistEntry
        waitlist_entry = session.exec(
            select(WaitlistEntry).where(WaitlistEntry.email == user_data.email)
        ).first()
        developer_code = waitlist_entry.developer_code if waitlist_entry else None

        # Create new user (unverified)
        user = User(
            email=user_data.email,
            password_hash=hashed,
            name=user_data.name,
            is_developer=False,
            is_verified=False,
            verification_token=verification_token,
            verification_sent_at=datetime.utcnow(),
            developer_code=developer_code  # Copy from waitlist if exists
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # Send verification email via Resend
        try:
            send_verification_email(user_data.email, user_data.name, verification_token)
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send verification email: {e}")
            # Don't fail signup if email fails, just log it

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail="Server error. Please try again.")

    # Create token
    access_token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_developer": user.is_developer,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(request: Request, user_data: UserLogin, session = Depends(get_session)):
    _check_rate_limit(request)

    # Find regular user (admins use a separate login; don't reveal which path failed)
    user = session.exec(select(User).where(User.email == user_data.email)).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Verify password
    if not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Create token
    access_token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_developer": user.is_developer,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified
        }
    }

@router.get("/validate", response_model=UserResponse)
def validate_token(
    request: Request,
    session = Depends(get_session)
):
    """Validate JWT token and return user info"""
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = session.exec(select(User).where(User.id == user_id)).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_developer": user.is_developer,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/become-developer")
def become_developer(
    request: Request,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Register user as a developer and send welcome email with developer code"""
    import secrets
    import string
    from services.email import send_developer_welcome_email

    # Check if user is already a developer
    if current_user.is_developer:
        raise HTTPException(status_code=400, detail="User is already a developer")

    # Generate unique developer code
    code_prefix = "DEV-"
    code_suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
    developer_code = f"{code_prefix}{code_suffix}"

    # Check if code already exists (unlikely but possible)
    existing = session.exec(select(User).where(User.developer_code == developer_code)).first()
    while existing:
        code_suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        developer_code = f"{code_prefix}{code_suffix}"
        existing = session.exec(select(User).where(User.developer_code == developer_code)).first()

    # Update user as developer
    current_user.is_developer = True
    current_user.developer_code = developer_code
    current_user.became_developer_at = datetime.utcnow()

    try:
        session.commit()

        # Send welcome email with developer code
        try:
            send_developer_welcome_email(current_user.email, current_user.name or "Developer", developer_code)
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send developer welcome email: {e}")
            # Don't fail the request if email fails, but log it

        return {
            "message": "Successfully registered as a developer",
            "developer_code": developer_code,
            "benefits": [
                "List your first item free",
                "$20 bonus after your first sale"
            ]
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to register as developer: {str(e)}")

@router.get("/verify-email")
def verify_email(token: str, session = Depends(get_session)):
    """Verify user email with token"""
    user = session.exec(select(User).where(User.verification_token == token)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    # Check if token is expired (24 hours); no timestamp means token predates expiry tracking — reject it
    if not user.verification_sent_at or (datetime.utcnow() - user.verification_sent_at) > timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Verification link expired")

    # Mark user as verified
    user.is_verified = True
    user.verification_token = None
    session.commit()

    return {"message": "Email verified successfully"}

@router.post("/resend-verification")
def resend_verification(
    request: Request,
    session = Depends(get_session)
):
    """Resend verification email"""
    _check_rate_limit(request)
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = session.exec(select(User).where(User.id == user_id)).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.is_verified:
            raise HTTPException(status_code=400, detail="Email already verified")

        # Generate new token
        import secrets
        user.verification_token = secrets.token_urlsafe(32)
        user.verification_sent_at = datetime.utcnow()
        session.commit()

        # Send email
        try:
            send_verification_email(user.email, user.name, user.verification_token)
            return {"message": "Verification email sent"}
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
            raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again later.")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Change user password - requires current password verification"""
    # Verify current password
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Hash new password and update
    current_user.password_hash = get_password_hash(request.new_password)
    session.commit()

    return {"message": "Password updated successfully"}


@router.delete("/account")
def delete_account(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Delete user account and all associated data"""
    from models import Listing, Product, Transaction, Review, ListingTranslation

    try:
        user_id = current_user.id

        # Delete user's reviews first (to avoid foreign key issues)
        reviews = session.exec(select(Review).where(Review.user_id == user_id)).all()
        for review in reviews:
            session.delete(review)

        # Delete user's listings and their translations
        listings = session.exec(select(Listing).where(Listing.owner_id == user_id)).all()
        for listing in listings:
            # Delete translations first
            translations = session.exec(select(ListingTranslation).where(ListingTranslation.listing_id == listing.id)).all()
            for t in translations:
                session.delete(t)
            session.delete(listing)

        # Delete user's products
        products = session.exec(select(Product).where(Product.owner_id == user_id)).all()
        for product in products:
            session.delete(product)

        # Keep transactions for record-keeping but anonymize them
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

        # Finally, delete the user
        session.delete(current_user)
        session.commit()

        return {"message": "Account deleted successfully"}

    except Exception as e:
        session.rollback()
        print(f"[DELETE ACCOUNT ERROR] {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to delete account")


# User Purchases
@router.get("/purchases")
def get_user_purchases(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get current user's purchase history"""
    from models import Transaction, Product, User

    transactions = session.exec(
        select(Transaction, Product, User)
        .join(Product, Transaction.product_id == Product.id)
        .join(User, Transaction.seller_id == User.id, isouter=True)
        .where(Transaction.buyer_id == current_user.id)
        .order_by(Transaction.created_at.desc())
    ).all()

    return [
        {
            "id": str(t.id),
            "product_name": p.name,
            "product_slug": p.slug,
            "amount_cents": t.amount_cents,
            "status": t.status,
            "created_at": t.created_at.isoformat(),
            "seller_name": s.name if s else "Unknown"
        }
        for t, p, s in transactions
    ]


# User Reviews
@router.get("/reviews")
def get_user_reviews(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get current user's reviews"""
    from models import Review, Product

    reviews = session.exec(
        select(Review, Product)
        .join(Product, Review.product_id == Product.id)
        .where(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
    ).all()

    return [
        {
            "id": str(r.id),
            "product_name": p.name,
            "product_slug": p.slug,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at.isoformat()
        }
        for r, p in reviews
    ]


@router.delete("/reviews/{review_id}")
def delete_user_review(
    review_id: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Delete a review owned by the current user"""
    from models import Review
    from uuid import UUID

    try:
        review_uuid = UUID(review_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid review ID")

    review = session.exec(
        select(Review).where(
            Review.id == review_uuid,
            Review.user_id == current_user.id
        )
    ).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    session.delete(review)
    session.commit()

    return {"message": "Review deleted successfully"}


# Notification Preferences
class NotificationPreferences(BaseModel):
    email_marketing: bool = True
    email_purchases: bool = True
    email_reviews: bool = True
    email_listings: bool = True
    email_security: bool = True


@router.get("/notification-preferences")
def get_notification_preferences(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Get user's notification preferences"""
    # For now, return defaults. In production, store in database
    return {
        "email_marketing": True,
        "email_purchases": True,
        "email_reviews": True,
        "email_listings": True,
        "email_security": True
    }


@router.put("/notification-preferences")
def update_notification_preferences(
    prefs: NotificationPreferences,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Update user's notification preferences"""
    # For now, just return success. In production, store in database
    return prefs
