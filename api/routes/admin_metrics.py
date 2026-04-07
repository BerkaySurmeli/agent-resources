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
    if not settings.CLOUDFLARE_API_TOKEN or not settings.CLOUDFLARE_ZONE_ID:
        # Return mock data if not configured
        return {
            "requests": 0,
            "bandwidth": 0,
            "views": 0,
            "visits": 0,
            "period": "24h"
        }
    
    try:
        # Calculate time range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # GraphQL query for analytics
        query = {
            "query": f"""
            query {{
                viewer {{
                    zones(filter: {{zoneTag: "{settings.CLOUDFLARE_ZONE_ID}"}}) {{
                        httpRequests1dGroups(
                            limit: 1,
                            filter: {{date_geq: "{start_time.strftime('%Y-%m-%d')}"}}
                        ) {{
                            dimensions {{date}}
                            sum {{
                                requests
                                bytes
                                pageViews
                                visits
                            }}
                        }}
                    }}
                }}
            }}
            """
        }
        
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={
                "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/json"
            },
            json=query,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            zones = data.get("data", {}).get("viewer", {}).get("zones", [])
            if zones and zones[0].get("httpRequests1dGroups"):
                group = zones[0]["httpRequests1dGroups"][0]
                sums = group.get("sum", {})
                return {
                    "requests": sums.get("requests", 0),
                    "bandwidth": sums.get("bytes", 0),
                    "views": sums.get("pageViews", 0),
                    "visits": sums.get("visits", 0),
                    "period": "24h"
                }
        
        # Fallback to simple API if GraphQL fails
        response = requests.get(
            f"https://api.cloudflare.com/client/v4/zones/{settings.CLOUDFLARE_ZONE_ID}/analytics/dashboard",
            headers={"Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                result = data.get("result", {})
                timeseries = result.get("timeseries", [{}])[0]
                return {
                    "requests": timeseries.get("requests", {}).get("all", 0),
                    "bandwidth": timeseries.get("bandwidth", {}).get("all", 0),
                    "views": timeseries.get("pageviews", {}).get("all", 0),
                    "visits": timeseries.get("uniques", {}).get("all", 0),
                    "period": "24h"
                }
    except Exception as e:
        print(f"[CLOUDFLARE ERROR] {e}")
    
    # Return zeros if API fails
    return {
        "requests": 0,
        "bandwidth": 0,
        "views": 0,
        "visits": 0,
        "period": "24h"
    }

@router.get("/metrics/")
def get_cloudflare_metrics(hours: int = 24):
    """Get Cloudflare analytics for the website"""
    return get_cloudflare_analytics(hours)

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
