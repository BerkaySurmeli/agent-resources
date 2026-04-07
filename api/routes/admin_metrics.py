from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select, create_engine
from models import WaitlistEntry
from core.config import settings
import requests

class DeleteRequest(BaseModel):
    email: str

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

def check_admin_auth(request: Request):
    """Simple password check - in production use proper auth"""
    # Get password from header
    password = request.headers.get('X-Admin-Password')
    if password != '16384bEr32768!':
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/waitlist")
def get_waitlist_details(request: Request):
    check_admin_auth(request)
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

@router.post("/waitlist/delete/")
def delete_waitlist_entry(request: Request, delete_req: DeleteRequest):
    check_admin_auth(request)
    session = get_db_session()
    entry = session.exec(select(WaitlistEntry).where(WaitlistEntry.email == delete_req.email)).first()
    
    if entry:
        session.delete(entry)
        session.commit()
        session.close()
        return {"status": "success", "message": f"{delete_req.email} removed from waitlist"}
    
    session.close()
    raise HTTPException(status_code=404, detail="Email not found")
