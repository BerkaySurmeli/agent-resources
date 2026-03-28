from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import create_engine
from api.core.config import settings
from api.models import SQLModel

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

@app.get("/health")
async def health():
    return {"status": "online", "db_ready": True, "version": "1.0.0"}
