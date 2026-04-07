from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select, create_engine
from models import WaitlistEntry
from core.config import settings
import requests

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_db_session():
    engine = create_engine(settings.DATABASE_URL)
    return Session(engine)

@router.get("/metrics")
def get_cloudflare_metrics():
    """Get Cloudflare analytics for the website"""
    # This is a placeholder - you'll need to implement actual Cloudflare API calls
    # For now, return mock data
    return {
        "requests": 15234,
        "bandwidth": 2.5e9,  # 2.5 GB
        "views": 8934,
        "visits": 4521,
        "period": "24h"
    }

@router.get("/waitlist")
def get_waitlist_details():
    """Get detailed waitlist for admin"""
    session = get_db_session()
    entries = session.exec(select(WaitlistEntry)).all()
    session.close()
    
    return {
        "total": len(entries),
        "entries": [
            {
                "email": e.email,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "source": e.source,
                "developer_code": e.developer_code
            }
            for e in entries
        ]
    }
