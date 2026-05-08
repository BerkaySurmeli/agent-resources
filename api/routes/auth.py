from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File
from pydantic import BaseModel, EmailStr, Field
from sqlmodel import select
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from collections import defaultdict
import time
import os
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
    invite_code: str | None = None

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
        # Check if user exists — could be a guest row created by the webhook
        existing = session.exec(select(User).where(User.email == user_data.email)).first()
        if existing and not existing.is_guest:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Hash password
        hashed = get_password_hash(user_data.password)

        # Generate verification token
        import secrets
        verification_token = secrets.token_urlsafe(32)

        # Check if email is in waitlist; optionally consume an invite code
        from models import WaitlistEntry
        waitlist_entry = session.exec(
            select(WaitlistEntry).where(WaitlistEntry.email == user_data.email)
        ).first()
        # Also accept invite code that may belong to a different waitlist row (e.g. forwarded link)
        if not waitlist_entry and user_data.invite_code:
            waitlist_entry = session.exec(
                select(WaitlistEntry).where(WaitlistEntry.invite_code == user_data.invite_code)
            ).first()
        developer_code = waitlist_entry.developer_code if waitlist_entry else None

        # Grant 6-month commission-free window for early signups within launch period
        commission_free_until = None
        if settings.LAUNCH_CUTOFF_DATE:
            try:
                cutoff = datetime.strptime(settings.LAUNCH_CUTOFF_DATE, "%Y-%m-%d")
                if datetime.utcnow() < cutoff:
                    commission_free_until = datetime.utcnow() + timedelta(days=183)
            except ValueError:
                pass

        # Send verification email BEFORE committing the user row.
        # If the email fails we raise immediately and nothing is persisted.
        try:
            send_verification_email(user_data.email, user_data.name, verification_token)
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send verification email: {e}")
            raise HTTPException(
                status_code=503,
                detail="Could not send verification email. Please try again or contact support."
            )

        if existing and existing.is_guest:
            # Upgrade the guest row to a full account — purchase history is preserved
            existing.password_hash = hashed
            existing.name = user_data.name
            existing.is_guest = False
            existing.is_verified = False
            existing.verification_token = verification_token
            existing.verification_sent_at = datetime.utcnow()
            existing.developer_code = existing.developer_code or developer_code
            existing.commission_free_until = commission_free_until
            user = existing
        else:
            # Email delivered — now persist everything in one transaction.
            user = User(
                email=user_data.email,
                password_hash=hashed,
                name=user_data.name,
                is_developer=False,
                is_verified=False,
                verification_token=verification_token,
                verification_sent_at=datetime.utcnow(),
                developer_code=developer_code,
                commission_free_until=commission_free_until,
            )
            session.add(user)

        # Mark waitlist entry as converted and invalidate its invite code
        if waitlist_entry and waitlist_entry.converted_at is None:
            waitlist_entry.converted_at = datetime.utcnow()
            waitlist_entry.invite_code = None  # prevent reuse
            session.add(waitlist_entry)

        session.commit()
        session.refresh(user)

    except HTTPException:
        session.rollback()
        raise
    except Exception as e:
        session.rollback()
        err_str = str(e)
        if "developer_code" in err_str and "unique" in err_str.lower():
            raise HTTPException(status_code=400, detail="Developer code conflict. Please try again.")
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

    # Block unverified accounts
    if not user.is_verified:
        raise HTTPException(
            status_code=403,
            detail="Please verify your email before signing in. Check your inbox for a verification link."
        )

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

        # Resolve plan status
        from models import Subscription
        sub = session.exec(
            select(Subscription).where(
                Subscription.user_id == user.id,
                Subscription.status == "active",
            )
        ).first()
        is_pro = sub is not None
        commission_free = (
            user.commission_free_until is not None
            and user.commission_free_until > datetime.utcnow()
        )

        return {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_developer": user.is_developer,
            "avatar_url": user.avatar_url,
            "is_verified": user.is_verified,
            "profile_slug": user.profile_slug,
            "bio": user.bio,
            "website": user.website,
            "twitter": user.twitter,
            "github": user.github,
            "is_pro": is_pro,
            "commission_free": commission_free,
            "commission_free_until": user.commission_free_until.isoformat() if user.commission_free_until else None,
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

    # Generate unique developer code (36^8 ≈ 2.8 trillion combinations; collision is astronomically unlikely)
    code_prefix = "DEV-"
    for _ in range(10):
        code_suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        developer_code = f"{code_prefix}{code_suffix}"
        if not session.exec(select(User).where(User.developer_code == developer_code)).first():
            break
    else:
        raise HTTPException(status_code=500, detail="Could not generate a unique developer code. Please try again.")

    # Auto-generate profile_slug from name if not already set
    if not current_user.profile_slug and current_user.name:
        import re
        base_slug = re.sub(r'[^\w\s-]', '', current_user.name.lower())
        base_slug = re.sub(r'[-\s]+', '-', base_slug).strip('-')[:50]
        slug = base_slug
        counter = 1
        while session.exec(select(User).where(User.profile_slug == slug)).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        current_user.profile_slug = slug

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

class ResendVerificationRequest(BaseModel):
    email: EmailStr | None = None


@router.post("/resend-verification")
async def resend_verification(
    request: Request,
    body: ResendVerificationRequest = ResendVerificationRequest(),
    session = Depends(get_session)
):
    """Resend verification email. Accepts either a Bearer token or {email} in the body."""
    _check_rate_limit(request)

    user = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            user = session.exec(select(User).where(User.id == user_id)).first()
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    elif body.email:
        # Accept email in body — always return a generic 200 to avoid user enumeration
        user = session.exec(select(User).where(User.email == body.email)).first()
        if not user or user.is_verified:
            return {"message": "If that address is registered and unverified, a new email has been sent."}
    else:
        raise HTTPException(status_code=400, detail="Provide a Bearer token or an email address")

    if not user or user.is_verified:
        return {"message": "If that address is registered and unverified, a new email has been sent."}

    import secrets
    new_token = secrets.token_urlsafe(32)

    try:
        send_verification_email(user.email, user.name, new_token)
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again later.")

    user.verification_token = new_token
    user.verification_sent_at = datetime.utcnow()
    session.commit()
    return {"message": "Verification email sent"}


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Change user password - requires current password verification"""
    if not current_user.password_hash:
        raise HTTPException(status_code=400, detail="No password set on this account")
    if not verify_password(request.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # Hash new password and update
    current_user.password_hash = get_password_hash(request.new_password)
    session.commit()

    return {"message": "Password updated successfully"}


# ── Password reset ────────────────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/forgot-password")
def forgot_password(request: Request, body: ForgotPasswordRequest, session = Depends(get_session)):
    """Request a password-reset link. Always returns 200 to prevent user enumeration."""
    _check_rate_limit(request)
    user = session.exec(select(User).where(User.email == body.email)).first()
    if not user:
        return {"message": "If that address is registered, a reset link has been sent."}

    import secrets
    token = secrets.token_urlsafe(32)

    # Persist token before sending email so the link is always resolvable
    user.password_reset_token = token
    user.password_reset_sent_at = datetime.utcnow()
    session.commit()

    from services.email import EmailService
    try:
        EmailService.send_password_reset_email(user.email, user.name or user.email.split("@")[0], token)
    except Exception as e:
        print(f"[EMAIL ERROR] Password reset email failed: {e}")
        raise HTTPException(status_code=503, detail="Could not send reset email. Please try again.")

    return {"message": "If that address is registered, a reset link has been sent."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, session = Depends(get_session)):
    """Consume a password-reset token and set a new password."""
    user = session.exec(
        select(User).where(User.password_reset_token == body.token)
    ).first()

    if not user or not user.password_reset_sent_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    if (datetime.utcnow() - user.password_reset_sent_at) > timedelta(hours=1):
        raise HTTPException(status_code=400, detail="Reset link has expired. Please request a new one.")

    user.password_hash = get_password_hash(body.new_password)
    user.password_reset_token = None
    user.password_reset_sent_at = None
    session.commit()
    return {"message": "Password updated successfully"}


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=500)
    website: Optional[str] = Field(default=None, max_length=255)
    twitter: Optional[str] = Field(default=None, max_length=100)
    github: Optional[str] = Field(default=None, max_length=100)
    profile_slug: Optional[str] = Field(default=None, min_length=2, max_length=60)


@router.put("/profile")
def update_profile(
    data: UpdateProfileRequest,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Update user profile fields"""
    import re

    if data.name is not None:
        current_user.name = data.name

    if data.bio is not None:
        current_user.bio = data.bio

    if data.website is not None:
        current_user.website = data.website or None

    if data.twitter is not None:
        current_user.twitter = data.twitter or None

    if data.github is not None:
        current_user.github = data.github or None

    if data.profile_slug is not None:
        # Sanitize and validate slug
        slug = re.sub(r'[^\w-]', '-', data.profile_slug.lower()).strip('-')
        if not slug:
            raise HTTPException(status_code=400, detail="Invalid profile slug")
        # Check uniqueness
        existing = session.exec(
            select(User).where(User.profile_slug == slug, User.id != current_user.id)
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail="Profile URL is already taken")
        current_user.profile_slug = slug

    session.commit()

    return {
        "message": "Profile updated successfully",
        "profile_slug": current_user.profile_slug,
        "name": current_user.name,
        "bio": current_user.bio,
        "website": current_user.website,
        "twitter": current_user.twitter,
        "github": current_user.github,
        "avatar_url": current_user.avatar_url,
    }


@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Upload avatar image — stores to local disk, returns public URL"""
    import uuid

    AVATAR_DIR = os.environ.get("AVATAR_DIR", "/tmp/avatars")
    MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5 MB
    # Magic-byte signatures for allowed image types
    _MAGIC: dict[bytes, str] = {
        b"\xff\xd8\xff": "jpeg",
        b"\x89PNG\r\n\x1a\n": "png",
        b"GIF87a": "gif",
        b"GIF89a": "gif",
        b"RIFF": "webp",  # checked further below
    }

    def _detect_image_type(data: bytes) -> Optional[str]:
        if data[:3] == b"\xff\xd8\xff":
            return "jpeg"
        if data[:8] == b"\x89PNG\r\n\x1a\n":
            return "png"
        if data[:6] in (b"GIF87a", b"GIF89a"):
            return "gif"
        if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
            return "webp"
        return None

    ALLOWED_TYPES = {"jpeg", "png", "gif", "webp"}

    os.makedirs(AVATAR_DIR, exist_ok=True)

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="Avatar must be under 5 MB")

    img_type = _detect_image_type(content)
    if img_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type. Use: {', '.join(ALLOWED_TYPES)}")

    filename = f"{uuid.uuid4()}.{img_type}"
    file_path = os.path.join(AVATAR_DIR, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Remove old avatar file if it was locally stored
    if current_user.avatar_url and current_user.avatar_url.startswith("/avatars/"):
        old_path = os.path.join(AVATAR_DIR, os.path.basename(current_user.avatar_url))
        try:
            os.remove(old_path)
        except OSError:
            pass

    avatar_url = f"/avatars/{filename}"
    current_user.avatar_url = avatar_url
    session.commit()

    return {"avatar_url": avatar_url}


@router.delete("/account")
def delete_account(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Delete user account and all associated data"""
    from models import Listing, Product, Transaction, Review, ListingTranslation, Collection, CollectionItem

    try:
        user_id = current_user.id

        # Delete user's reviews first (to avoid foreign key issues)
        reviews = session.exec(select(Review).where(Review.user_id == user_id)).all()
        for review in reviews:
            session.delete(review)

        # Delete user's collections and their items to avoid FK violations
        for coll in session.exec(select(Collection).where(Collection.owner_id == user_id)).all():
            for ci in session.exec(select(CollectionItem).where(CollectionItem.collection_id == coll.id)).all():
                session.delete(ci)
            session.delete(coll)

        # Delete user's listings, their translations, and uploaded files
        listings = session.exec(select(Listing).where(Listing.owner_id == user_id)).all()
        for listing in listings:
            translations = session.exec(select(ListingTranslation).where(ListingTranslation.listing_id == listing.id)).all()
            for t in translations:
                session.delete(t)
            if listing.file_path:
                try:
                    os.remove(listing.file_path)
                except OSError:
                    pass
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
            "product_id": str(p.id),
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
