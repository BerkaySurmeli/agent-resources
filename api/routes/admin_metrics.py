from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select, create_engine
from models import WaitlistEntry
from core.config import settings
import requests
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["Admin"])

class DeleteRequest(BaseModel):
    email: str

def get_db_session():
    engine = create_engine(settings.DATABASE_URL)
    return Session(engine)

def check_admin_auth(request: Request):
    """Simple password check - in production use proper auth"""
    password = request.headers.get('X-Admin-Password')
    if password != '16384bEr32768!':
        raise HTTPException(status_code=401, detail="Unauthorized")

def get_cloudflare_analytics(hours: int = 24):
    """Fetch real analytics from Cloudflare for specified time range"""
    # Debug logging
    print(f"[CLOUDFLARE DEBUG] API Token set: {bool(settings.CLOUDFLARE_API_TOKEN)}")
    print(f"[CLOUDFLARE DEBUG] Zone ID set: {bool(settings.CLOUDFLARE_ZONE_ID)}")
    print(f"[CLOUDFLARE DEBUG] API Token length: {len(settings.CLOUDFLARE_API_TOKEN) if settings.CLOUDFLARE_API_TOKEN else 0}")
    print(f"[CLOUDFLARE DEBUG] Zone ID value: {settings.CLOUDFLARE_ZONE_ID[:10] + '...' if settings.CLOUDFLARE_ZONE_ID else 'NOT SET'}")
    
    if not settings.CLOUDFLARE_API_TOKEN or not settings.CLOUDFLARE_ZONE_ID:
        # Return mock data if not configured
        print("[CLOUDFLARE DEBUG] Returning zeros - credentials not configured")
        return {
            "requests": 0,
            "bandwidth": 0,
            "views": 0,
            "visits": 0,
            "period": "24h"
        }
    
    try:
        # Use the analytics dashboard API
        # Calculate time range
        end_time = int(datetime.utcnow().timestamp())
        start_time = int((datetime.utcnow() - timedelta(hours=hours)).timestamp())
        
        response = requests.get(
            f"https://api.cloudflare.com/client/v4/zones/{settings.CLOUDFLARE_ZONE_ID}/analytics/dashboard",
            headers={"Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}"},
            params={"since": start_time, "until": end_time, "continuous": "true"},
            timeout=10
        )
        
        print(f"[CLOUDFLARE DEBUG] Response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"[CLOUDFLARE DEBUG] API success: {data.get('success')}")
            if data.get("success"):
                result = data.get("result", {})
                # Sum up all timeseries data
                timeseries = result.get("timeseries", [])
                print(f"[CLOUDFLARE DEBUG] Timeseries points: {len(timeseries)}")
                total_requests = sum(t.get("requests", {}).get("all", 0) for t in timeseries)
                total_bandwidth = sum(t.get("bandwidth", {}).get("all", 0) for t in timeseries)
                total_views = sum(t.get("pageviews", {}).get("all", 0) for t in timeseries)
                # For unique visitors, use the last data point (approximation)
                total_visits = timeseries[-1].get("uniques", {}).get("all", 0) if timeseries else 0
                
                print(f"[CLOUDFLARE DEBUG] Calculated metrics - requests: {total_requests}, views: {total_views}, visits: {total_visits}")
                return {
                    "requests": total_requests,
                    "bandwidth": total_bandwidth,
                    "views": total_views,
                    "visits": total_visits,
                    "period": f"{hours}h"
                }
            else:
                print(f"[CLOUDFLARE DEBUG] API returned errors: {data.get('errors')}")
        else:
            error_text = response.text[:500]
            print(f"[CLOUDFLARE DEBUG] API error response: {error_text}")
            # Return error info for debugging
            return {
                "requests": 0,
                "bandwidth": 0,
                "views": 0,
                "visits": 0,
                "period": "24h",
                "_error": f"API returned {response.status_code}: {error_text}"
            }
    except Exception as e:
        print(f"[CLOUDFLARE ERROR] {e}")
        import traceback
        traceback.print_exc()
        return {
            "requests": 0,
            "bandwidth": 0,
            "views": 0,
            "visits": 0,
            "period": "24h",
            "_error": str(e)
        }

@router.get("/metrics/")
def get_cloudflare_metrics(hours: int = 24):
    """Get Cloudflare analytics for the website"""
    return get_cloudflare_analytics(hours)

@router.get("/metrics/debug/")
def debug_cloudflare_config():
    """Debug endpoint to check Cloudflare configuration"""
    return {
        "api_token_set": bool(settings.CLOUDFLARE_API_TOKEN),
        "api_token_length": len(settings.CLOUDFLARE_API_TOKEN) if settings.CLOUDFLARE_API_TOKEN else 0,
        "api_token_prefix": settings.CLOUDFLARE_API_TOKEN[:10] + "..." if settings.CLOUDFLARE_API_TOKEN else None,
        "zone_id_set": bool(settings.CLOUDFLARE_ZONE_ID),
        "zone_id": settings.CLOUDFLARE_ZONE_ID
    }

@router.get("/waitlist/")
def get_waitlist_details(request: Request):
    """Get detailed waitlist for admin"""
    check_admin_auth(request)
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
    """Delete email from waitlist (admin only)"""
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
