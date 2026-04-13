from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlmodel import create_engine
from core.config import settings
from models import SQLModel
from routes import waitlist, payments, payments_connect, auth, admin, listings, products, developers, search, contact, onboarding
import re

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

# Custom CORS middleware to support regex patterns
class DynamicCORSMiddleware:
    def __init__(self, app, allow_origins_patterns=None, allow_credentials=True, allow_methods=None, allow_headers=None):
        self.app = app
        self.allow_origins_patterns = allow_origins_patterns or []
        self.allow_credentials = allow_credentials
        self.allow_methods = allow_methods or ["*"]
        self.allow_headers = allow_headers or ["*"]
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        origin = request.headers.get("origin", "")
        
        # Check if origin matches any pattern
        allowed = False
        for pattern in self.allow_origins_patterns:
            if re.match(pattern, origin):
                allowed = True
                break
        
        if request.method == "OPTIONS":
            # Handle preflight
            headers = {
                "Access-Control-Allow-Methods": ", ".join(self.allow_methods),
                "Access-Control-Allow-Headers": ", ".join(self.allow_headers),
                "Access-Control-Max-Age": "600",
            }
            if allowed:
                headers["Access-Control-Allow-Origin"] = origin
                if self.allow_credentials:
                    headers["Access-Control-Allow-Credentials"] = "true"
            
            response = Response(status_code=200, headers=headers)
            await response(scope, receive, send)
            return
        
        # Wrap send to add CORS headers
        async def wrapped_send(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                if allowed:
                    headers.append((b"access-control-allow-origin", origin.encode()))
                    if self.allow_credentials:
                        headers.append((b"access-control-allow-credentials", b"true"))
                message["headers"] = headers
            await send(message)
        
        await self.app(scope, receive, wrapped_send)

# CORS patterns - supports exact URLs and regex patterns
allow_origins_patterns = [
    r"^https://shopagentresources\.com$",
    r"^http://localhost:3000$",
    r"^https://web-.*-agent-resources\.vercel\.app$",  # All Vercel preview deployments
    r"^https://agent-resources.*\.vercel\.app$",  # Git-based Vercel URLs
    r"^https://agent-resources-api-dev-production\.up\.railway\.app$",
]

app.add_middleware(
    DynamicCORSMiddleware,
    allow_origins_patterns=allow_origins_patterns,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(waitlist.router)
app.include_router(payments.router)  # Legacy - remove after migration
app.include_router(payments_connect.router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(listings.router)
app.include_router(products.router)
app.include_router(developers.router)
app.include_router(search.router)
app.include_router(contact.router)
app.include_router(onboarding.router)

@app.get("/health")
async def health():
    return {"status": "online", "db_ready": True, "version": "1.0.0"}

@app.get("/test-auth")
async def test_auth():
    return {"message": "Auth routes should be at /auth/signup and /auth/login"}

# Deploy Mon Apr  6 12:14:37 PDT 2026
