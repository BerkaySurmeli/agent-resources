from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from core.database import get_session
from models import User
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Zoho Mail configuration
ZOHO_SMTP_SERVER = os.getenv("ZOHO_SMTP_SERVER", "smtp.zoho.com")
ZOHO_SMTP_PORT = int(os.getenv("ZOHO_SMTP_PORT", "587"))
ZOHO_EMAIL = os.getenv("ZOHO_EMAIL", "info@shopagentresources.com")
ZOHO_PASSWORD = os.getenv("ZOHO_PASSWORD", "")

def send_verification_email(to_email: str, name: str, token: str):
    """Send verification email via Zoho SMTP"""
    if not ZOHO_PASSWORD:
        print("[EMAIL] Zoho password not configured, cannot send email")
        print(f"[EMAIL] Verification link: https://shopagentresources.com/verify-email?token={token}")
        raise Exception("Email service not configured. Please contact support.")

    msg = MIMEMultipart('alternative')
    msg['Subject'] = 'Welcome to Agent Resources - Verify Your Email'
    msg['From'] = f"Agent Resources <{ZOHO_EMAIL}>"
    msg['To'] = to_email

    verification_url = f"https://shopagentresources.com/verify-email?token={token}"

    # Plain text version
    text_body = f"""
Hi {name},

Welcome to Agent Resources! Please verify your email address to start buying and selling AI agents.

Click the link below to verify your email:
{verification_url}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Agent Resources Team
"""

    # HTML version
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: #2563eb; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-weight: bold; font-size: 24px;">AR</span>
        </div>
        <h1 style="color: #0f172a; margin: 0;">Welcome to Agent Resources</h1>
    </div>

    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <p style="margin-top: 0;">Hi {name},</p>
        <p>Welcome to Agent Resources! Please verify your email address to start buying and selling AI agents.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                Verify Email Address
            </a>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
    </div>

    <div style="text-align: center; font-size: 14px; color: #64748b;">
        <p>Best regards,<br>The Agent Resources Team</p>
        <p style="margin-top: 20px;">
            <a href="https://shopagentresources.com" style="color: #2563eb;">shopagentresources.com</a>
        </p>
    </div>
</body>
</html>
"""

    part1 = MIMEText(text_body, 'plain')
    part2 = MIMEText(html_body, 'html')

    msg.attach(part1)
    msg.attach(part2)

    # Send email
    with smtplib.SMTP(ZOHO_SMTP_SERVER, ZOHO_SMTP_PORT) as server:
        server.starttls()
        server.login(ZOHO_EMAIL, ZOHO_PASSWORD)
        server.send_message(msg)

    print(f"[EMAIL] Verification email sent to {to_email}")

# Security - use argon2 which doesn't have the 72-byte limit
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# Pydantic models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str | None
    is_developer: bool
    avatar_url: str | None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Truncate to 72 bytes for bcrypt compatibility
    try:
        return pwd_context.hash(password[:72])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hash error: {str(e)}")

def create_access_token(data: dict, expires_delta: timedelta | None = None):
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

# Routes
@router.post("/signup", response_model=TokenResponse)
def signup(user_data: UserSignup, session = Depends(get_session)):
    try:
        # Check if user exists
        existing = session.exec(select(User).where(User.email == user_data.email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed = pwd_context.hash(user_data.password)
        
        # Generate verification token
        import secrets
        verification_token = secrets.token_urlsafe(32)
        
        # Create new user (unverified)
        user = User(
            email=user_data.email,
            password_hash=hashed,
            name=user_data.name,
            is_developer=False,
            is_verified=False,
            verification_token=verification_token,
            verification_sent_at=datetime.utcnow()
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Send verification email via Zoho
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
def login(user_data: UserLogin, session = Depends(get_session)):
    # Find user
    user = session.exec(select(User).where(User.email == user_data.email)).first()
    if not user:
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
def become_developer(session = Depends(get_session)):
    # Toggle is_developer flag
    raise HTTPException(status_code=501, detail="Not implemented")

@router.get("/verify-email")
def verify_email(token: str, session = Depends(get_session)):
    """Verify user email with token"""
    user = session.exec(select(User).where(User.verification_token == token)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    # Check if token is expired (24 hours)
    if user.verification_sent_at:
        time_diff = datetime.utcnow() - user.verification_sent_at
        if time_diff > timedelta(hours=24):
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


# Dependency to get current user from JWT token
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


@router.delete("/account")
def delete_account(
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token)
):
    """Delete user account and all associated data"""
    from models import Listing, Product, Transaction, Review, ListingTranslation
    
    try:
        user_id = current_user.id
        print(f"[DELETE ACCOUNT] Starting deletion for user {user_id}")
        
        # Delete user's reviews first (to avoid foreign key issues)
        reviews = session.exec(select(Review).where(Review.user_id == user_id)).all()
        for review in reviews:
            session.delete(review)
        print(f"[DELETE ACCOUNT] Deleted {len(reviews)} reviews")
        
        # Delete user's listings and their translations
        listings = session.exec(select(Listing).where(Listing.owner_id == user_id)).all()
        for listing in listings:
            # Delete translations first
            translations = session.exec(select(ListingTranslation).where(ListingTranslation.listing_id == listing.id)).all()
            for t in translations:
                session.delete(t)
            session.delete(listing)
        print(f"[DELETE ACCOUNT] Deleted {len(listings)} listings")
        
        # Delete user's products
        products = session.exec(select(Product).where(Product.owner_id == user_id)).all()
        for product in products:
            session.delete(product)
        print(f"[DELETE ACCOUNT] Deleted {len(products)} products")
        
        # Note: We keep transactions for record-keeping but anonymize them
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
        print(f"[DELETE ACCOUNT] Anonymized {len(transactions)} transactions")
        
        # Finally, delete the user
        session.delete(current_user)
        session.commit()
        print(f"[DELETE ACCOUNT] Successfully deleted user {user_id}")
        
        return {"message": "Account deleted successfully"}
        
    except Exception as e:
        session.rollback()
        error_msg = str(e)
        print(f"[DELETE ACCOUNT ERROR] {error_msg}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {error_msg}")
