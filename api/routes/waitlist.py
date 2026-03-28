from fastapi import APIRouter
from sqlmodel import Session, select, create_engine
from models import WaitlistEntry
from core.config import settings

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])

def get_db_session():
    engine = create_engine(settings.DATABASE_URL)
    return Session(engine)

@router.post("/")
def join_waitlist(email: str, source: str = "website"):
    """Add email to waitlist"""
    session = get_db_session()
    # Check if already exists
    existing = session.exec(select(WaitlistEntry).where(WaitlistEntry.email == email)).first()
    if existing:
        session.close()
        return {"status": "already_registered", "message": "You're already on the waitlist!"}
    
    # Create new entry
    entry = WaitlistEntry(email=email, source=source)
    session.add(entry)
    session.commit()
    session.close()
    
    return {"status": "success", "message": "You've been added to the waitlist!"}

@router.get("/count")
def get_waitlist_count():
    """Get total waitlist count"""
    session = get_db_session()
    entries = session.exec(select(WaitlistEntry)).all()
    count = len(entries)
    session.close()
    return {"count": count, "spots_remaining": max(0, 500 - count)}
