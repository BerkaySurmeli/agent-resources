from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import select
from models import WaitlistEntry, AdminUser
from core.config import settings
from core.database import get_session
from routes.admin import get_current_admin_from_token
import httpx
from datetime import datetime, timedelta

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_cloudflare_analytics(hours: int = 24):
    """Fetch analytics from Cloudflare for specified time range"""
    if not settings.CLOUDFLARE_API_TOKEN or not settings.CLOUDFLARE_ZONE_ID:
        return {
            "requests": 0,
            "bandwidth": 0,
            "views": 0,
            "visits": 0,
            "period": f"{hours}h"
        }

    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        end_date = end_time.strftime("%Y-%m-%d")
        start_date = start_time.strftime("%Y-%m-%d")

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

        with httpx.Client(timeout=10) as client:
            response = client.post(
                "https://api.cloudflare.com/client/v4/graphql",
                headers={
                    "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=graphql_query,
            )

        if response.status_code == 200:
            data = response.json()

            if data.get("errors"):
                return {"requests": 0, "bandwidth": 0, "views": 0, "visits": 0, "period": f"{hours}h"}

            zones = data.get("data", {}).get("viewer", {}).get("zones", [])

            if zones and zones[0].get("httpRequests1dGroups"):
                groups = zones[0]["httpRequests1dGroups"]

                total_requests = sum(g.get("sum", {}).get("requests", 0) for g in groups)
                total_bandwidth = sum(g.get("sum", {}).get("bytes", 0) for g in groups)
                total_pageviews = sum(g.get("sum", {}).get("pageViews", 0) or 0 for g in groups)

                if total_pageviews == 0 or total_pageviews < total_requests * 0.1:
                    total_pageviews = total_requests

                total_uniques = sum(g.get("uniq", {}).get("uniques", 0) or 0 for g in groups)

                return {
                    "requests": total_requests,
                    "bandwidth": total_bandwidth,
                    "views": total_pageviews,
                    "visits": total_uniques,
                    "period": f"{hours}h",
                    "days_of_data": len(groups)
                }

    except Exception as e:
        print(f"[CLOUDFLARE ERROR] {e}")

    return {
        "requests": 0,
        "bandwidth": 0,
        "views": 0,
        "visits": 0,
        "period": f"{hours}h"
    }


@router.get("/metrics/")
def get_cloudflare_metrics(
    hours: int = 24,
    admin: AdminUser = Depends(get_current_admin_from_token)
):
    """Get Cloudflare analytics for the website"""
    return get_cloudflare_analytics(hours)
