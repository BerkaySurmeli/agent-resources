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
    print(f"[CLOUDFLARE DEBUG] Hours requested: {hours}")
    print(f"[CLOUDFLARE DEBUG] API Token set: {bool(settings.CLOUDFLARE_API_TOKEN)}")
    print(f"[CLOUDFLARE DEBUG] Zone ID set: {bool(settings.CLOUDFLARE_ZONE_ID)}")
    
    if not settings.CLOUDFLARE_API_TOKEN or not settings.CLOUDFLARE_ZONE_ID:
        print("[CLOUDFLARE DEBUG] Returning zeros - credentials not configured")
        return {
            "requests": 0,
            "bandwidth": 0,
            "views": 0,
            "visits": 0,
            "period": f"{hours}h"
        }
    
    try:
        # Calculate date range
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # Format dates for Cloudflare API
        end_date = end_time.strftime("%Y-%m-%d")
        start_date = start_time.strftime("%Y-%m-%d")
        
        print(f"[CLOUDFLARE DEBUG] Date range: {start_date} to {end_date}")
        
        # Use GraphQL API with daily groups
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
        
        print(f"[CLOUDFLARE DEBUG] Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("errors"):
                print(f"[CLOUDFLARE DEBUG] GraphQL errors: {data['errors']}")
                return {"requests": 0, "bandwidth": 0, "views": 0, "visits": 0, "period": f"{hours}h"}
            
            zones = data.get("data", {}).get("viewer", {}).get("zones", [])
            
            if zones and zones[0].get("httpRequests1dGroups"):
                groups = zones[0]["httpRequests1dGroups"]
                print(f"[CLOUDFLARE DEBUG] Got {len(groups)} day groups")
                
                # Sum up totals across all days
                total_requests = sum(g.get("sum", {}).get("requests", 0) for g in groups)
                total_bandwidth = sum(g.get("sum", {}).get("bytes", 0) for g in groups)
                
                # Debug: Check what fields are actually available
                sample_group = groups[0] if groups else {}
                sample_sum = sample_group.get("sum", {})
                print(f"[CLOUDFLARE DEBUG] Sample group fields: {list(sample_sum.keys())}")
                print(f"[CLOUDFLARE DEBUG] Sample pageViews: {sample_sum.get('pageViews', 'NOT_FOUND')}")
                
                # Try to get pageViews, but use requests as fallback
                # pageViews is often not available on free Cloudflare plans
                total_pageviews = sum(g.get("sum", {}).get("pageViews", 0) or 0 for g in groups)
                
                # If pageViews is 0 or very low compared to requests, use requests instead
                # This indicates pageViews isn't being tracked properly
                if total_pageviews == 0 or total_pageviews < total_requests * 0.1:
                    print(f"[CLOUDFLARE DEBUG] pageViews ({total_pageviews}) seems incorrect, using requests ({total_requests}) instead")
                    total_pageviews = total_requests
                
                # Sum unique visitors across all days (this is approximate)
                total_uniques = sum(g.get("uniq", {}).get("uniques", 0) or 0 for g in groups)
                
                print(f"[CLOUDFLARE DEBUG] Final totals - requests: {total_requests}, pageviews: {total_pageviews}, uniques: {total_uniques}")
                
                return {
                    "requests": total_requests,
                    "bandwidth": total_bandwidth,
                    "views": total_pageviews,
                    "visits": total_uniques,
                    "period": f"{hours}h",
                    "days_of_data": len(groups)
                }
            else:
                print("[CLOUDFLARE DEBUG] No zones or data groups found")
        else:
            print(f"[CLOUDFLARE DEBUG] API error: {response.text[:500]}")
            
    except Exception as e:
        print(f"[CLOUDFLARE ERROR] {e}")
        import traceback
        traceback.print_exc()
    
    # Return zeros if anything fails
    return {
        "requests": 0,
        "bandwidth": 0,
        "views": 0,
        "visits": 0,
        "period": f"{hours}h"
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
