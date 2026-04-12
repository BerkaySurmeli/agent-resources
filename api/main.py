from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import create_engine
from core.config import settings
from models import SQLModel
from routes import waitlist, payments, auth, admin, listings, admin, products, developers, search, contact

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    engine = create_engine(settings.DATABASE_URL, echo=settings.DB_ECHO)
    app.state.engine = engine
    yield
    # Shutdown
    engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend for MCP Server & Persona Distribution",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://shopagentresources.com", "http://localhost:3000", "https://web-e51fjhuko-agent-resources.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(waitlist.router)
app.include_router(payments.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(listings.router)
app.include_router(admin.router)
app.include_router(products.router)
app.include_router(developers.router)
app.include_router(search.router)
app.include_router(contact.router)

@app.get("/health")
async def health():
    return {"status": "online", "db_ready": True, "version": "1.0.0"}

@app.get("/test-auth")
async def test_auth():
    return {"message": "Auth routes should be at /auth/signup and /auth/login"}

# Temporary endpoint to create master admin - remove after use
@app.post("/setup-admin")
async def setup_admin():
    """Create master admin user if none exists"""
    from sqlmodel import select
    from core.database import get_session
    from models import AdminUser, User
    from passlib.context import CryptContext
    
    pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
    session = next(get_session())
    
    try:
        # Check if admin exists
        admin_email = "admin@shopagentresources.com"
        existing = session.exec(select(AdminUser).where(AdminUser.email == admin_email)).first()
        if existing:
            return {"status": "exists", "message": "Admin user already exists", "email": existing.email}
        
        # Create master admin with different email
        admin = AdminUser(
            email=admin_email,
            password_hash=pwd_context.hash("16384bEr32768!"),
            name="Master Admin",
            is_master_admin=True
        )
        session.add(admin)
        session.commit()
        return {"status": "created", "message": "Master admin created", "email": admin.email}
    except Exception as e:
        session.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        session.close()

# Deploy Mon Apr  6 12:14:37 PDT 2026
