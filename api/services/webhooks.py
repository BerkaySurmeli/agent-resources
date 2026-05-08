"""
Webhook delivery service — Phase 9 headless.

CloudEvents 1.0 envelope + HMAC-SHA256 signing + BackgroundTasks delivery.

Supported event types:
  agent.purchase.completed   — a purchase transaction completed
  agent.manifest.updated     — a listing's manifest was updated
  agent.listing.approved     — a new listing passed review and went live
  agent.wallet.low_balance   — wallet balance dropped below threshold
"""
import hashlib
import hmac
import json
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

import httpx
from sqlmodel import Session, select

from models import WebhookDelivery, WebhookSubscription

SOURCE = "https://api.shopagentresources.com"

SUPPORTED_EVENTS = {
    "agent.purchase.completed",
    "agent.manifest.updated",
    "agent.listing.approved",
    "agent.wallet.low_balance",
}

# Retry schedule: attempt 1 immediately, then 1 min, 5 min, 30 min
_RETRY_DELAYS = [0, 60, 300, 1800]


# ---------------------------------------------------------------------------
# CloudEvents 1.0 envelope
# ---------------------------------------------------------------------------

def build_cloud_event(event_type: str, data: Dict, subject: Optional[str] = None) -> Dict:
    return {
        "specversion":     "1.0",
        "id":              str(uuid4()),
        "source":          SOURCE,
        "type":            event_type,
        "time":            datetime.utcnow().isoformat() + "Z",
        "datacontenttype": "application/json",
        **({"subject": subject} if subject else {}),
        "data":            data,
    }


# ---------------------------------------------------------------------------
# HMAC-SHA256 signature
# ---------------------------------------------------------------------------

def _sign_payload(payload_bytes: bytes, raw_secret: str) -> str:
    sig = hmac.new(raw_secret.encode(), payload_bytes, hashlib.sha256)
    return f"sha256={sig.hexdigest()}"


def hash_secret(raw_secret: str) -> str:
    return hashlib.sha256(raw_secret.encode()).hexdigest()


def verify_secret(raw_secret: str, stored_hash: str) -> bool:
    return hmac.compare_digest(
        hashlib.sha256(raw_secret.encode()).hexdigest(),
        stored_hash,
    )


# ---------------------------------------------------------------------------
# Delivery
# ---------------------------------------------------------------------------

async def _deliver_once(url: str, event: Dict, raw_secret: str) -> tuple[int, str]:
    """
    Attempt a single delivery. Returns (http_status, error_message).
    error_message is empty string on success.
    """
    body = json.dumps(event, default=str).encode()
    sig  = _sign_payload(body, raw_secret)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                content=body,
                headers={
                    "Content-Type":       "application/cloudevents+json",
                    "X-Webhook-Signature": sig,
                    "User-Agent":         "AgentResources-Webhooks/1.0",
                },
            )
            if resp.status_code < 300:
                return resp.status_code, ""
            return resp.status_code, f"HTTP {resp.status_code}"
    except httpx.TimeoutException:
        return 0, "timeout"
    except Exception as e:
        return 0, str(e)[:200]


def _next_retry(attempt: int) -> Optional[datetime]:
    if attempt >= len(_RETRY_DELAYS):
        return None
    return datetime.utcnow() + timedelta(seconds=_RETRY_DELAYS[attempt])


# ---------------------------------------------------------------------------
# Fan-out: create delivery records + enqueue background delivery
# ---------------------------------------------------------------------------

def fanout_event(
    event_type: str,
    data: Dict,
    subject: Optional[str],
    user_id: UUID,
    session: Session,
) -> List[UUID]:
    """
    Find all active subscriptions for this user+event_type, create WebhookDelivery
    rows, and return their IDs. Actual HTTP delivery is triggered separately via
    BackgroundTasks so the request returns immediately.
    """
    subs = session.execute(
        select(WebhookSubscription).where(
            WebhookSubscription.user_id == user_id,
            WebhookSubscription.is_active == True,
        )
    ).scalars().all()

    event  = build_cloud_event(event_type, data, subject)
    ids: List[UUID] = []

    for sub in subs:
        if event_type not in (sub.event_types or []):
            continue
        delivery = WebhookDelivery(
            subscription_id=sub.id,
            event_type=event_type,
            event_id=event["id"],
            payload=event,
            status="pending",
            next_retry_at=datetime.utcnow(),
        )
        session.add(delivery)
        ids.append(delivery.id)

    if ids:
        session.commit()

    return ids


async def deliver_pending(delivery_id: UUID, raw_secret: str, url: str):
    """
    Called from BackgroundTasks. Delivers one pending WebhookDelivery.
    Opens its own DB session to avoid sharing the request session across threads.
    """
    from core.database import engine
    from sqlmodel import Session as DBSession

    with DBSession(engine) as session:
        delivery = session.execute(
            select(WebhookDelivery).where(WebhookDelivery.id == delivery_id)
        ).scalars().first()

        if not delivery or delivery.status == "delivered":
            return

        attempt = delivery.attempt_count + 1
        status_code, error = await _deliver_once(url, delivery.payload, raw_secret)

        delivery.attempt_count = attempt
        delivery.last_attempt_at = datetime.utcnow()
        delivery.response_status = status_code or None

        if not error:
            delivery.status = "delivered"
            delivery.next_retry_at = None
        else:
            delivery.error_message = error
            next_rt = _next_retry(attempt)
            if next_rt:
                delivery.status = "pending"
                delivery.next_retry_at = next_rt
            else:
                delivery.status = "failed"
                delivery.next_retry_at = None

        session.add(delivery)
        session.commit()
