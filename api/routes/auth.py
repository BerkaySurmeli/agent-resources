from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from core.database import get_session
from models import User
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

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
        
        # TODO: Send verification email
        # For now, just print to logs (in production, use SendGrid/AWS SES)
        print(f"[EMAIL] Verification link: https://shopagentresources.com/verify-email?token={verification_token}")
        
    except Exception as e:
        session.rollback()
        import traceback
        raise HTTPException(status_code=500, detail=f"Error: {str(e)} | {traceback.format_exc()[:200]}")
    
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
            "avatar_url": user.avatar_url
        }
    }

@router.get("/me", response_model=UserResponse)
def get_current_user(session = Depends(get_session)):
    # For now, return a mock user - in production, get from JWT token
    raise HTTPException(status_code=401, detail="Not implemented")

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
    
    # Mark as verified
    user.is_verified = True
    user.verification_token = None
    session.commit()
    
    return {"message": "Email verified successfully", "email": user.email}

@router.post("/resend-verification")
def resend_verification(email: EmailStr, session = Depends(get_session)):
    """Resend verification email"""
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new token
    import secrets
    user.verification_token = secrets.token_urlsafe(32)
    user.verification_sent_at = datetime.utcnow()
    session.commit()
    
    # TODO: Send email
    print(f"[EMAIL] Verification link: https://shopagentresources.com/verify-email?token={user.verification_token}")
    
    return {"message": "Verification email sent"}
