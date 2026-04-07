from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlmodel import create_engine
from core.config import settings
from models import SQLModel
from routes import waitlist, payments, auth, admin, listings, admin, products, developers, search, contact, admin_metrics

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

# Trust proxy headers (for Railway/Cloudflare)
@app.middleware("http")
async def forward_https(request: Request, call_next):
    # Check if request came through HTTPS
    if request.headers.get("X-Forwarded-Proto") == "https":
        request.scope["scheme"] = "https"
    response = await call_next(request)
    return response

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://shopagentresources.com", "http://localhost:3000", "https://web-e51fjhuko-agent-resources.vercel.app", "https://web-hhkpzwdqj-agent-resources.vercel.app"],
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
app.include_router(admin_metrics.router)

@app.get("/health")
async def health():
    return {"status": "online", "db_ready": True, "version": "1.0.0"}

@app.get("/test-auth")
async def test_auth():
    return {"message": "Auth routes should be at /auth/signup and /auth/login"}
# Deploy Mon Apr  6 12:14:37 PDT 2026
