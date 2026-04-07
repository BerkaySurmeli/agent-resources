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
        # Use GraphQL API (the REST analytics API is deprecated)
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(hours=hours)).strftime("%Y-%m-%d")
        
        graphql_query = {
            "query": """
                query GetZoneAnalytics($zoneId: String!, $since: Time!, $until: Time!) {
                    viewer {
                        zones(filter: { zoneTag: $zoneId }) {
                            httpRequests1dGroups(
                                limit: 100
                                filter: { date_geq: $since, date_leq: $until }
                            ) {
                                dimensions { date }
                                sum { requests bytes cachedBytes threats pageViews }
                                uniq { uniques }
                            }
                        }
                    }
                }
            """,
            "variables": {
                "zoneId": settings.CLOUDFLARE_ZONE_ID,
                "since": start_date,
                "until": end_date
            }
        }
        
        response = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={
                "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
                "Content-Type": "application/json"
            },
            json=graphql_query,
            timeout=10
        )
        
        print(f"[CLOUDFLARE DEBUG] GraphQL Response status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if data.get("data") and data["data"].get("viewer"):
                zones = data["data"]["viewer"].get("zones", [])
                if zones and zones[0].get("httpRequests1dGroups"):
                    groups = zones[0]["httpRequests1dGroups"]
                    print(f"[CLOUDFLARE DEBUG] Got {len(groups)} day groups")
                    
                    total_requests = sum(g.get("sum", {}).get("requests", 0) for g in groups)
                    total_bandwidth = sum(g.get("sum", {}).get("bytes", 0) for g in groups)
                    # pageViews might not be available on all plans, use requests as fallback for views
                    total_views = sum(g.get("sum", {}).get("pageViews", 0) for g in groups)
                    if total_views == 0:
                        # Fallback: use unique visitors summed across all days
                        total_views = sum(g.get("uniq", {}).get("uniques", 0) for g in groups)
                    # Get unique visitors from the most recent day
                    total_visits = groups[-1].get("uniq", {}).get("uniques", 0) if groups else 0
                    
                    print(f"[CLOUDFLARE DEBUG] Calculated metrics - requests: {total_requests}, views: {total_views}, visits: {total_visits}")
                    return {
                        "requests": total_requests,
                        "bandwidth": total_bandwidth,
                        "views": total_views,
                        "visits": total_visits,
                        "period": f"{hours}h"
                    }
                else:
                    print(f"[CLOUDFLARE DEBUG] No data groups found")
            else:
                print(f"[CLOUDFLARE DEBUG] GraphQL errors: {data.get('errors')}")
        else:
            error_text = response.text[:500]
            print(f"[CLOUDFLARE DEBUG] API error: {error_text}")
    except Exception as e:
        print(f"[CLOUDFLARE ERROR] {e}")
        import traceback
        traceback.print_exc()
    
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
