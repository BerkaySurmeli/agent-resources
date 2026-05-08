"""
Webhook subscription management — Phase 9 headless.

Human owner registers endpoint URLs; agents trigger events that fan out
to those endpoints as signed CloudEvents 1.0 payloads.

Endpoints (human JWT auth):
  POST   /webhooks                     — register subscription
  GET    /webhooks                     — list subscriptions
  DELETE /webhooks/{id}                — deactivate subscription
  GET    /webhooks/{id}/deliveries     — delivery history for a subscription
  POST   /webhooks/retry/{delivery_id} — manually retry a failed delivery

Internal (called by other routes after key actions):
  emit_purchase_completed(...)
  emit_manifest_updated(...)
  emit_listing_approved(...)
  emit_wallet_low_balance(...)
"""
import secrets
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, HttpUrl
from sqlmodel import select

from core.database import get_session
from models import OAuthClient, Product, Transaction, User, WebhookDelivery, WebhookSubscription
from routes.auth import get_current_user_from_token
from services.webhooks import (
    SUPPORTED_EVENTS,
    deliver_pending,
    fanout_event,
)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

_LOW_BALANCE_THRESHOLD_CENTS = 500  # warn when wallet drops below $5


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class SubscribeRequest(BaseModel):
    url: str
    event_types: List[str]


class SubscriptionResponse(BaseModel):
    id: str
    url: str
    event_types: List[str]
    is_active: bool
    created_at: str


class DeliveryResponse(BaseModel):
    id: str
    event_type: str
    event_id: str
    status: str
    attempt_count: int
    last_attempt_at: Optional[str]
    response_status: Optional[int]
    error_message: Optional[str]
    created_at: str


# ---------------------------------------------------------------------------
# Subscription management
# ---------------------------------------------------------------------------

@router.post("", status_code=201)
async def subscribe(
    body: SubscribeRequest,
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    """Register a webhook endpoint. Returns the signing secret exactly once."""
    bad = [e for e in body.event_types if e not in SUPPORTED_EVENTS]
    if bad:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown event type(s): {bad}. Supported: {sorted(SUPPORTED_EVENTS)}",
        )
    if not body.event_types:
        raise HTTPException(status_code=400, detail="At least one event_type is required")

    raw_secret = f"whsec_{secrets.token_hex(24)}"

    sub = WebhookSubscription(
        user_id=current_user.id,
        url=body.url,
        secret_hash=raw_secret,   # stored raw; used directly as HMAC-SHA256 key
        event_types=body.event_types,
    )
    session.add(sub)
    session.commit()
    session.refresh(sub)

    return {
        "id":           str(sub.id),
        "url":          sub.url,
        "event_types":  sub.event_types,
        "is_active":    sub.is_active,
        "created_at":   sub.created_at.isoformat(),
        "signing_secret": raw_secret,
        "warning": "Save signing_secret now — it will not be shown again",
        "verify_docs": (
            "Verify deliveries by computing HMAC-SHA256 over the raw request body "
            "using signing_secret and comparing to X-Webhook-Signature header."
        ),
    }


@router.get("", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    subs = session.execute(
        select(WebhookSubscription)
        .where(WebhookSubscription.user_id == current_user.id)
        .order_by(WebhookSubscription.created_at.desc())
    ).scalars().all()

    return [
        SubscriptionResponse(
            id=str(s.id), url=s.url,
            event_types=s.event_types or [],
            is_active=s.is_active,
            created_at=s.created_at.isoformat(),
        )
        for s in subs
    ]


@router.delete("/{subscription_id}", status_code=204)
async def delete_subscription(
    subscription_id: str,
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    sub = session.execute(
        select(WebhookSubscription).where(WebhookSubscription.id == subscription_id)
    ).scalars().first()

    if not sub or str(sub.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.is_active = False
    sub.updated_at = datetime.utcnow()
    session.add(sub)
    session.commit()


@router.get("/{subscription_id}/deliveries", response_model=List[DeliveryResponse])
async def list_deliveries(
    subscription_id: str,
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    sub = session.execute(
        select(WebhookSubscription).where(WebhookSubscription.id == subscription_id)
    ).scalars().first()

    if not sub or str(sub.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Subscription not found")

    deliveries = session.execute(
        select(WebhookDelivery)
        .where(WebhookDelivery.subscription_id == sub.id)
        .order_by(WebhookDelivery.created_at.desc())
        .limit(100)
    ).scalars().all()

    return [
        DeliveryResponse(
            id=str(d.id),
            event_type=d.event_type,
            event_id=d.event_id,
            status=d.status,
            attempt_count=d.attempt_count,
            last_attempt_at=d.last_attempt_at.isoformat() if d.last_attempt_at else None,
            response_status=d.response_status,
            error_message=d.error_message,
            created_at=d.created_at.isoformat(),
        )
        for d in deliveries
    ]


@router.post("/retry/{delivery_id}", status_code=202)
async def retry_delivery(
    delivery_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    """Manually trigger re-delivery of a failed webhook."""
    delivery = session.execute(
        select(WebhookDelivery).where(WebhookDelivery.id == delivery_id)
    ).scalars().first()

    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    sub = session.execute(
        select(WebhookSubscription).where(WebhookSubscription.id == delivery.subscription_id)
    ).scalars().first()

    if not sub or str(sub.user_id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Delivery not found")

    delivery.status = "pending"
    delivery.next_retry_at = datetime.utcnow()
    session.add(delivery)
    session.commit()

    background_tasks.add_task(deliver_pending, delivery.id, sub.secret_hash, sub.url)
    return {"queued": True, "delivery_id": delivery_id}


# ---------------------------------------------------------------------------
# Emit helpers — called by other routes after key business events
# ---------------------------------------------------------------------------

async def _emit(
    event_type: str,
    data: dict,
    subject: str,
    user_id: UUID,
    background_tasks: BackgroundTasks,
    session,
):
    delivery_ids = fanout_event(event_type, data, subject, user_id, session)
    if not delivery_ids:
        return

    subs = {
        str(s.id): s
        for s in session.execute(
            select(WebhookSubscription).where(WebhookSubscription.user_id == user_id)
        ).scalars().all()
    }

    deliveries = session.execute(
        select(WebhookDelivery).where(
            WebhookDelivery.id.in_([str(d) for d in delivery_ids])
        )
    ).scalars().all()

    for d in deliveries:
        sub = subs.get(str(d.subscription_id))
        if sub:
            background_tasks.add_task(deliver_pending, d.id, sub.secret_hash, sub.url)


async def emit_purchase_completed(
    transaction: Transaction,
    product: Product,
    user_id: UUID,
    background_tasks: BackgroundTasks,
    session,
):
    await _emit(
        "agent.purchase.completed",
        {
            "transaction_id": str(transaction.id),
            "product_slug":   product.slug,
            "product_name":   product.name,
            "amount_cents":   transaction.amount_cents,
            "category":       product.category,
        },
        subject=product.slug,
        user_id=user_id,
        background_tasks=background_tasks,
        session=session,
    )


async def emit_manifest_updated(
    product: Product,
    user_id: UUID,
    background_tasks: BackgroundTasks,
    session,
):
    await _emit(
        "agent.manifest.updated",
        {
            "product_slug": product.slug,
            "product_name": product.name,
            "category":     product.category,
            "manifest_url": f"https://api.shopagentresources.com/v1/manifest/{product.slug}",
        },
        subject=product.slug,
        user_id=user_id,
        background_tasks=background_tasks,
        session=session,
    )


async def emit_listing_approved(
    product: Product,
    user_id: UUID,
    background_tasks: BackgroundTasks,
    session,
):
    await _emit(
        "agent.listing.approved",
        {
            "product_slug": product.slug,
            "product_name": product.name,
            "category":     product.category,
            "catalog_url":  f"https://api.shopagentresources.com/v1/catalog/{product.slug}",
        },
        subject=product.slug,
        user_id=user_id,
        background_tasks=background_tasks,
        session=session,
    )


async def emit_wallet_low_balance(
    wallet_balance_cents: int,
    user_id: UUID,
    background_tasks: BackgroundTasks,
    session,
):
    if wallet_balance_cents >= _LOW_BALANCE_THRESHOLD_CENTS:
        return
    await _emit(
        "agent.wallet.low_balance",
        {
            "balance_cents":   wallet_balance_cents,
            "balance_display": f"${wallet_balance_cents/100:.2f}",
            "threshold_cents": _LOW_BALANCE_THRESHOLD_CENTS,
            "topup_url":       "https://shopagentresources.com/dashboard/wallet",
        },
        subject="wallet",
        user_id=user_id,
        background_tasks=background_tasks,
        session=session,
    )
