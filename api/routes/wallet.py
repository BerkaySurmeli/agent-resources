"""
Agent Wallet — Phase 7 headless.

Human owner tops up their wallet via Stripe checkout.
Agent clients draw down the balance at purchase time without needing a card.

Endpoints (human-facing, JWT auth):
  POST /wallet/topup          — create Stripe checkout session to add credits
  GET  /wallet                — current balance + ledger summary
  GET  /wallet/topups         — top-up history

Internal helper (used by mcp_server purchase flow):
  wallet_deduct(user_id, amount_cents, product_slug, session) → Transaction
"""
import stripe
from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import text
from sqlmodel import select

from core.config import settings
from core.database import get_session
from models import AgentWallet, OAuthClient, Product, Transaction, User, WalletTopup
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/wallet", tags=["Wallet"])

stripe.api_key = settings.STRIPE_SECRET_KEY

# Minimum and maximum top-up amounts
_MIN_TOPUP_CENTS = 500    # $5
_MAX_TOPUP_CENTS = 500_00  # $500


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_or_create_wallet(user_id: UUID, session) -> AgentWallet:
    wallet = session.execute(
        select(AgentWallet).where(AgentWallet.user_id == user_id)
    ).scalars().first()
    if not wallet:
        wallet = AgentWallet(user_id=user_id)
        session.add(wallet)
        session.commit()
        session.refresh(wallet)
    return wallet


def wallet_deduct(
    user_id: UUID,
    amount_cents: int,
    product_slug: str,
    product_id: UUID,
    seller_id: UUID,
    idempotency_key: str,
    client: OAuthClient,
    session,
) -> dict:
    """
    Atomically deduct from wallet and record a Transaction.
    Uses SELECT FOR UPDATE to prevent double-spend under concurrent requests.
    Returns a result dict (does NOT commit — caller owns the transaction boundary).
    """
    if amount_cents == 0:
        tx = Transaction(
            buyer_id=user_id,
            seller_id=seller_id,
            product_id=product_id,
            amount_cents=0,
            platform_fee_cents=0,
            stripe_payment_intent_id=f"wallet_free_{idempotency_key}",
            status="completed",
        )
        session.add(tx)
        client.spent_cents = (client.spent_cents or 0)
        session.add(client)
        session.commit()
        session.refresh(tx)
        return {"status": "completed", "amount_cents": 0, "transaction_id": str(tx.id)}

    # Row-level lock on the wallet row to prevent concurrent double-spend
    session.execute(
        text("SELECT id FROM agent_wallets WHERE user_id = :uid FOR UPDATE"),
        {"uid": str(user_id)},
    )

    wallet = session.execute(
        select(AgentWallet).where(AgentWallet.user_id == user_id)
    ).scalars().first()

    if not wallet or wallet.balance_cents < amount_cents:
        balance = wallet.balance_cents if wallet else 0
        raise ValueError(
            f"Insufficient wallet balance. "
            f"Need ${amount_cents/100:.2f}, have ${balance/100:.2f}. "
            f"Top up at shopagentresources.com/dashboard/wallet."
        )

    platform_fee = int(amount_cents * 0.10)

    tx = Transaction(
        buyer_id=user_id,
        seller_id=seller_id,
        product_id=product_id,
        amount_cents=amount_cents,
        platform_fee_cents=platform_fee,
        stripe_payment_intent_id=f"wallet_{idempotency_key}",
        status="completed",
    )
    session.add(tx)

    wallet.balance_cents -= amount_cents
    wallet.lifetime_spent_cents = (wallet.lifetime_spent_cents or 0) + amount_cents
    wallet.updated_at = datetime.utcnow()
    session.add(wallet)

    client.spent_cents = (client.spent_cents or 0) + amount_cents
    session.add(client)

    session.commit()
    session.refresh(tx)

    return {
        "status":           "completed",
        "amount_cents":     amount_cents,
        "transaction_id":   str(tx.id),
        "wallet_balance_remaining": wallet.balance_cents,
    }


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TopupRequest(BaseModel):
    amount_cents: int
    success_url: str
    cancel_url: str


class WalletResponse(BaseModel):
    balance_cents: int
    balance_display: str
    lifetime_topup_cents: int
    lifetime_spent_cents: int
    created_at: str
    updated_at: str


class TopupRecord(BaseModel):
    id: str
    amount_cents: int
    status: str
    created_at: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/topup")
async def create_topup_session(
    body: TopupRequest,
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    """
    Create a Stripe Checkout session to top up the agent wallet.
    On success, Stripe redirects to success_url and a webhook credits the balance.
    """
    if body.amount_cents < _MIN_TOPUP_CENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum top-up is ${_MIN_TOPUP_CENTS/100:.0f}",
        )
    if body.amount_cents > _MAX_TOPUP_CENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum top-up is ${_MAX_TOPUP_CENTS/100:.0f}",
        )

    wallet = _get_or_create_wallet(current_user.id, session)

    checkout = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "unit_amount": body.amount_cents,
                "product_data": {
                    "name": "Agent Wallet Top-up",
                    "description": f"Credits ${body.amount_cents/100:.2f} to your agent wallet",
                },
            },
            "quantity": 1,
        }],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        customer_email=current_user.email,
        metadata={
            "type":       "wallet_topup",
            "user_id":    str(current_user.id),
            "wallet_id":  str(wallet.id),
            "amount_cents": str(body.amount_cents),
        },
    )

    topup = WalletTopup(
        wallet_id=wallet.id,
        user_id=current_user.id,
        amount_cents=body.amount_cents,
        stripe_payment_intent_id=checkout.payment_intent or checkout.id,
        status="pending",
    )
    session.add(topup)
    session.commit()

    return {"checkout_url": checkout.url, "session_id": checkout.id}


@router.get("", response_model=WalletResponse)
async def get_wallet(
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    """Get current wallet balance and lifetime stats."""
    wallet = _get_or_create_wallet(current_user.id, session)
    return WalletResponse(
        balance_cents=wallet.balance_cents,
        balance_display=f"${wallet.balance_cents / 100:.2f}",
        lifetime_topup_cents=wallet.lifetime_topup_cents,
        lifetime_spent_cents=wallet.lifetime_spent_cents,
        created_at=wallet.created_at.isoformat(),
        updated_at=wallet.updated_at.isoformat(),
    )


@router.get("/topups", response_model=List[TopupRecord])
async def list_topups(
    current_user: User = Depends(get_current_user_from_token),
    session=Depends(get_session),
):
    """List all top-up history for the current user."""
    topups = session.execute(
        select(WalletTopup)
        .where(WalletTopup.user_id == current_user.id)
        .order_by(WalletTopup.created_at.desc())
    ).scalars().all()

    return [
        TopupRecord(
            id=str(t.id),
            amount_cents=t.amount_cents,
            status=t.status,
            created_at=t.created_at.isoformat(),
        )
        for t in topups
    ]


@router.post("/webhook/topup-complete")
async def wallet_topup_webhook(
    request: Request,
    session=Depends(get_session),
):
    """
    Stripe webhook — credits wallet on successful payment.
    Called automatically by Stripe when checkout.session.completed fires.
    """
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] != "checkout.session.completed":
        return {"received": True}

    session_obj = event["data"]["object"]
    meta = session_obj.get("metadata", {})

    if meta.get("type") != "wallet_topup":
        return {"received": True}

    amount_cents = int(meta.get("amount_cents", 0))
    wallet_id    = meta.get("wallet_id")
    pi_id        = session_obj.get("payment_intent") or session_obj.get("id")

    if not amount_cents or not wallet_id:
        return {"received": True}

    topup = session.execute(
        select(WalletTopup).where(
            WalletTopup.stripe_payment_intent_id == pi_id,
        )
    ).scalars().first()

    if topup and topup.status == "completed":
        return {"received": True}

    wallet = session.execute(
        select(AgentWallet).where(AgentWallet.id == wallet_id)
    ).scalars().first()

    if not wallet:
        return {"received": True}

    wallet.balance_cents += amount_cents
    wallet.lifetime_topup_cents = (wallet.lifetime_topup_cents or 0) + amount_cents
    wallet.updated_at = datetime.utcnow()
    session.add(wallet)

    if topup:
        topup.status = "completed"
        session.add(topup)

    session.commit()
    return {"received": True}
