from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from sqlmodel import select
import stripe
from datetime import datetime
import uuid

from core.config import settings
from core.database import get_session
from models import User, Listing, Product, Transaction, ListingStatus, Subscription
from routes.auth import get_current_user_from_token
from services.email import send_purchase_confirmation, send_sale_notification, send_bonus_notification

router = APIRouter(prefix="/payments", tags=["Payments"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET
STRIPE_SUB_WEBHOOK_SECRET = settings.STRIPE_SUB_WEBHOOK_SECRET

# Platform fee percentage (10%) — waived for Pro sellers and launch-window sellers
PLATFORM_FEE_PERCENT = 0.10

PRO_PRICE_CENTS = 1900  # $19/mo


def _seller_commission_rate(seller: User, session) -> float:
    """Return 0.0 if seller is Pro or within launch commission-free window, else 0.10."""
    # Check launch incentive first (no Stripe lookup needed)
    if seller.commission_free_until and seller.commission_free_until > datetime.utcnow():
        return 0.0
    # Check active Pro subscription
    sub = session.exec(
        select(Subscription).where(
            Subscription.user_id == seller.id,
            Subscription.status == "active",
        )
    ).first()
    return 0.0 if sub else PLATFORM_FEE_PERCENT

# Payout schedule: weekly on Mondays
PAYOUT_DAY = 0  # Monday (0=Monday, 6=Sunday)


class CartItem(BaseModel):
    listing_id: str
    quantity: int = 1


class CreateCheckoutRequest(BaseModel):
    items: List[CartItem]
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    session_id: str
    url: str


@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Create Stripe checkout session for cart items using real listings"""

    line_items = []
    total_amount_cents = 0
    listing_ids = []

    for cart_item in request.items:
        # Get listing from database
        listing = session.exec(
            select(Listing).where(Listing.id == cart_item.listing_id)
        ).first()

        if not listing:
            raise HTTPException(
                status_code=404,
                detail=f"Listing {cart_item.listing_id} not found"
            )

        # Check if listing is available for purchase
        if listing.virus_scan_status != 'clean':
            raise HTTPException(
                status_code=400,
                detail=f"Listing '{listing.name}' is not available for purchase (security scan pending)"
            )

        if listing.status != 'approved':
            raise HTTPException(
                status_code=400,
                detail=f"Listing '{listing.name}' is not approved for sale"
            )

        # Add to line items
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {
                    'name': listing.name,
                    'description': listing.description[:500] if listing.description else None,
                },
                'unit_amount': listing.price_cents,
            },
            'quantity': cart_item.quantity,
        })

        total_amount_cents += listing.price_cents * cart_item.quantity
        listing_ids.append(str(listing.id))

    if not line_items:
        raise HTTPException(status_code=400, detail="No valid items in cart")

    try:
        # Create Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_email=current_user.email,
            metadata={
                'listing_ids': ','.join(listing_ids),
                'customer_email': current_user.email,
                'platform': 'agent-resources'
            }
        )

        return {
            "session_id": checkout_session.id,
            "url": checkout_session.url
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


class ProCheckoutRequest(BaseModel):
    success_url: str
    cancel_url: str


@router.post("/pro/checkout")
async def create_pro_checkout(
    body: ProCheckoutRequest,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    """Create a Stripe Checkout session for the $19/mo Pro subscription."""
    if not settings.STRIPE_PRO_PRICE_ID:
        raise HTTPException(status_code=503, detail="Pro plan not configured")

    # Don't create a new subscription if one already exists
    existing = session.exec(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active",
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already subscribed to Pro")

    try:
        checkout = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": settings.STRIPE_PRO_PRICE_ID, "quantity": 1}],
            success_url=body.success_url,
            cancel_url=body.cancel_url,
            customer_email=current_user.email,
            metadata={"user_id": str(current_user.id), "platform": "agent-resources"},
        )
        return {"session_id": checkout.id, "url": checkout.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/pro/portal")
async def customer_portal(
    request: Request,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    """Return a Stripe Customer Portal URL so the user can manage/cancel their subscription."""
    sub = session.exec(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).first()
    if not sub or not sub.stripe_customer_id:
        raise HTTPException(status_code=404, detail="No active subscription found")

    base = str(request.base_url).rstrip("/")
    try:
        portal = stripe.billing_portal.Session.create(
            customer=sub.stripe_customer_id,
            return_url=f"{base}/settings?tab=plan",
        )
        return {"url": portal.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/pro/status")
async def get_pro_status(
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session),
):
    """Return the current user's plan status."""
    sub = session.exec(
        select(Subscription).where(Subscription.user_id == current_user.id)
    ).first()
    commission_free = (
        current_user.commission_free_until is not None
        and current_user.commission_free_until > datetime.utcnow()
    )
    return {
        "is_pro": sub is not None and sub.status == "active",
        "subscription_status": sub.status if sub else None,
        "current_period_end": sub.current_period_end.isoformat() if sub and sub.current_period_end else None,
        "commission_free": commission_free,
        "commission_free_until": current_user.commission_free_until.isoformat() if current_user.commission_free_until else None,
        "commission_rate": 0 if (sub and sub.status == "active") or commission_free else int(PLATFORM_FEE_PERCENT * 100),
    }


@router.post("/subscription-webhook")
async def subscription_webhook(request: Request):
    """Handle Stripe subscription lifecycle events (separate webhook endpoint)."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not STRIPE_SUB_WEBHOOK_SECRET:
        print("[WEBHOOK ERROR] STRIPE_SUB_WEBHOOK_SECRET is not configured")
        raise HTTPException(status_code=503, detail="Subscription webhook not configured")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_SUB_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook")

    from core.database import engine
    from sqlmodel import Session as DBSession

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed" and obj.get("mode") == "subscription":
        user_id = obj.get("metadata", {}).get("user_id")
        stripe_sub_id = obj.get("subscription")
        stripe_customer_id = obj.get("customer")
        if not user_id or not stripe_sub_id:
            return {"status": "ignored"}

        # Fetch period end from the subscription object
        stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
        period_end = datetime.utcfromtimestamp(stripe_sub["current_period_end"])

        with DBSession(engine) as db:
            existing = db.exec(
                select(Subscription).where(Subscription.user_id == user_id)
            ).first()
            if existing:
                existing.stripe_subscription_id = stripe_sub_id
                existing.stripe_customer_id = stripe_customer_id
                existing.status = "active"
                existing.current_period_end = period_end
                existing.updated_at = datetime.utcnow()
            else:
                db.add(Subscription(
                    user_id=user_id,
                    stripe_subscription_id=stripe_sub_id,
                    stripe_customer_id=stripe_customer_id,
                    status="active",
                    current_period_end=period_end,
                ))
            db.commit()

    elif event_type == "invoice.paid":
        stripe_sub_id = obj.get("subscription")
        stripe_sub = stripe.Subscription.retrieve(stripe_sub_id) if stripe_sub_id else None
        if not stripe_sub:
            return {"status": "ignored"}
        period_end = datetime.utcfromtimestamp(stripe_sub["current_period_end"])

        with DBSession(engine) as db:
            sub = db.exec(
                select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
            ).first()
            if sub:
                sub.status = "active"
                sub.current_period_end = period_end
                sub.updated_at = datetime.utcnow()
                db.commit()

    elif event_type in ("customer.subscription.deleted", "customer.subscription.updated"):
        stripe_sub_id = obj.get("id")
        new_status = obj.get("status", "canceled")  # active, past_due, canceled, etc.

        with DBSession(engine) as db:
            sub = db.exec(
                select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
            ).first()
            if sub:
                sub.status = "canceled" if event_type == "customer.subscription.deleted" else new_status
                sub.updated_at = datetime.utcnow()
                db.commit()

    return {"status": "ok"}


@router.post("/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Stripe webhook events"""

    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    if not STRIPE_WEBHOOK_SECRET:
        print("[WEBHOOK ERROR] STRIPE_WEBHOOK_SECRET is not configured")
        raise HTTPException(status_code=503, detail="Webhook not configured")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle checkout completion
    if event['type'] == 'checkout.session.completed':
        session_data = event['data']['object']
        await handle_successful_payment(session_data, background_tasks)

    return {"status": "success"}


async def handle_successful_payment(session_data: dict, background_tasks: BackgroundTasks):
    """Process successful payment and create transactions"""

    from core.database import engine
    from sqlmodel import Session as DBSession
    from sqlalchemy import text

    listing_ids_str = session_data.get('metadata', {}).get('listing_ids', '')
    customer_email = session_data.get('customer_email')
    stripe_payment_intent_id = session_data.get('payment_intent')

    if not listing_ids_str:
        print("[WEBHOOK] No listing IDs in session metadata")
        return

    listing_ids = listing_ids_str.split(',')

    try:
        with DBSession(engine) as db_session:
            # Collect email tasks to send after commit
            email_tasks = []

            for listing_id in listing_ids:
                listing = db_session.exec(
                    select(Listing).where(Listing.id == listing_id)
                ).first()

                if not listing:
                    continue

                # Skip listings that haven't been approved yet (no product created)
                if not listing.product_id:
                    print(f"[WEBHOOK] Listing {listing_id} has no product_id yet — skipping")
                    continue

                # Idempotency: skip duplicate webhook deliveries (check before any writes)
                existing_txn = db_session.exec(
                    select(Transaction).where(
                        Transaction.stripe_payment_intent_id == stripe_payment_intent_id,
                        Transaction.product_id == listing.product_id
                    )
                ).first()
                if existing_txn:
                    print(f"[WEBHOOK] Duplicate webhook for payment_intent={stripe_payment_intent_id}, listing={listing_id} — skipping")
                    continue

                # Find or create buyer only after idempotency check passes
                user = db_session.exec(
                    select(User).where(User.email == customer_email)
                ).first()
                if not user:
                    user = User(
                        email=customer_email,
                        name=customer_email.split('@')[0],
                        is_verified=True
                    )
                    db_session.add(user)
                    db_session.flush()  # get user.id without committing

                seller = db_session.exec(
                    select(User).where(User.id == listing.owner_id)
                ).first()

                total_amount_cents = listing.price_cents
                rate = _seller_commission_rate(seller, db_session) if seller else PLATFORM_FEE_PERCENT
                platform_fee_cents = int(total_amount_cents * rate)
                seller_amount_cents = total_amount_cents - platform_fee_cents

                transaction = Transaction(
                    id=uuid.uuid4(),
                    buyer_id=user.id,
                    seller_id=listing.owner_id,
                    product_id=listing.product_id,
                    amount_cents=total_amount_cents,
                    platform_fee_cents=platform_fee_cents,
                    stripe_payment_intent_id=stripe_payment_intent_id,
                    status="completed"
                )
                db_session.add(transaction)

                # Atomic download count increment — avoids lost update under concurrent webhooks
                db_session.exec(
                    text("UPDATE products SET download_count = download_count + 1 WHERE id = :pid"),
                    {"pid": listing.product_id}
                )

                # Developer code bonus: pay $20 on first sale — atomic claim to prevent double-spend
                bonus_task = None
                if listing.developer_code:
                    from sqlalchemy import text as _text
                    claimed = db_session.exec(
                        _text("UPDATE listings SET bonus_paid = TRUE WHERE id = :lid AND bonus_paid = FALSE RETURNING id"),
                        {"lid": str(listing.id)},
                    ).first()
                    if claimed:
                        if seller and seller.stripe_connect_id and seller.stripe_status == 'active':
                            try:
                                stripe.Transfer.create(
                                    amount=2000,  # $20.00 in cents
                                    currency="usd",
                                    destination=seller.stripe_connect_id,
                                    description=f"First-sale bonus for listing: {listing.name}",
                                    metadata={
                                        "listing_id": str(listing.id),
                                        "developer_code": listing.developer_code,
                                    }
                                )
                                bonus_task = (
                                    seller.email,
                                    seller.name or seller.email,
                                    listing.name,
                                )
                                print(f"[BONUS] $20 transfer created for seller {seller.id}, listing {listing.id}")
                            except stripe.error.StripeError as e:
                                print(f"[BONUS ERROR] Stripe transfer failed for listing {listing.id}: {e}")
                        else:
                            print(f"[BONUS] Seller {listing.owner_id} has no active Stripe Connect — bonus will retry when they onboard")

                email_tasks.append((
                    customer_email,
                    seller.email if seller else None,
                    listing.name,
                    total_amount_cents,
                    seller_amount_cents,
                    bonus_task,
                ))

            db_session.commit()
            print(f"[WEBHOOK] Processed payment for {len(listing_ids)} items")

            # Schedule emails only after successful commit
            for buyer_email, seller_email, listing_name, total_cents, seller_cents, bonus_task in email_tasks:
                background_tasks.add_task(send_purchase_confirmation, buyer_email, listing_name, total_cents / 100)
                if seller_email:
                    background_tasks.add_task(send_sale_notification, seller_email, listing_name, seller_cents / 100)
                if bonus_task:
                    seller_email_b, seller_name, b_listing_name = bonus_task
                    background_tasks.add_task(send_bonus_notification, seller_email_b, seller_name, b_listing_name, 20.0)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise  # Re-raise so FastAPI returns 500 and Stripe retries


@router.get("/session/{session_id}")
async def get_checkout_session(
    session_id: str,
    session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token),
):
    """Get checkout session details and purchase status"""

    try:
        stripe_session = stripe.checkout.Session.retrieve(session_id)

        # Get transactions for this payment
        payment_intent = stripe_session.get('payment_intent')
        transactions = []

        if payment_intent:
            txns = session.exec(
                select(Transaction).where(
                    Transaction.stripe_payment_intent_id == payment_intent
                )
            ).all()
            transactions = [
                {
                    "id": str(t.id),
                    "amount_cents": t.amount_cents,
                    "status": t.status,
                    "created_at": t.created_at.isoformat() if t.created_at else None
                }
                for t in txns
            ]

        return {
            "status": stripe_session.payment_status,
            "customer_email": stripe_session.customer_email,
            "listing_ids": stripe_session.metadata.get("listing_ids", "").split(",") if stripe_session.metadata else [],
            "transactions": transactions
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/my-purchases")
async def get_my_purchases(
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Get all purchases for current user"""

    transactions = session.exec(
        select(Transaction, Product, User)
        .join(Product, Transaction.product_id == Product.id)
        .join(User, Transaction.seller_id == User.id, isouter=True)
        .where(Transaction.buyer_id == current_user.id)
        .order_by(Transaction.created_at.desc())
    ).all()

    return [
        {
            "id": str(t.Transaction.id),
            "product": {
                "id": str(t.Product.id),
                "name": t.Product.name,
                "slug": t.Product.slug,
                "category": t.Product.category,
            },
            "seller": {
                "id": str(t.User.id) if t.User else None,
                "name": t.User.name if t.User else "Unknown"
            },
            "amount_cents": t.Transaction.amount_cents,
            "platform_fee_cents": t.Transaction.platform_fee_cents,
            "status": t.Transaction.status,
            "created_at": t.Transaction.created_at.isoformat() if t.Transaction.created_at else None
        }
        for t in transactions
    ]


@router.get("/my-sales")
async def get_my_sales(
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Get all sales for current user (developer)"""

    if not current_user.is_developer:
        raise HTTPException(status_code=403, detail="Only developers can view sales")

    transactions = session.exec(
        select(Transaction, Product, User)
        .join(Product, Transaction.product_id == Product.id)
        .join(User, Transaction.buyer_id == User.id, isouter=True)
        .where(Transaction.seller_id == current_user.id)
        .order_by(Transaction.created_at.desc())
    ).all()

    total_earnings = sum(
        t.Transaction.amount_cents - t.Transaction.platform_fee_cents
        for t in transactions
        if t.Transaction.status == "completed"
    )

    return {
        "total_earnings_cents": total_earnings,
        "total_sales": len(transactions),
        "sales": [
            {
                "id": str(t.Transaction.id),
                "product": {
                    "id": str(t.Product.id),
                    "name": t.Product.name,
                    "slug": t.Product.slug,
                },
                "buyer": {
                    "id": str(t.User.id) if t.User else None,
                    "name": t.User.name if t.User else "Anonymous"
                },
                "amount_cents": t.Transaction.amount_cents,
                "platform_fee_cents": t.Transaction.platform_fee_cents,
                "net_earnings_cents": t.Transaction.amount_cents - t.Transaction.platform_fee_cents,
                "status": t.Transaction.status,
                "created_at": t.Transaction.created_at.isoformat() if t.Transaction.created_at else None
            }
            for t in transactions
        ]
    }


@router.get("/earnings-summary")
async def get_earnings_summary(
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Get earnings summary for developer dashboard"""

    if not current_user.is_developer:
        raise HTTPException(status_code=403, detail="Only developers can view earnings")

    # Get all completed sales
    transactions = session.exec(
        select(Transaction)
        .where(
            Transaction.seller_id == current_user.id,
            Transaction.status == "completed"
        )
    ).all()

    total_sales = len(transactions)
    total_revenue_cents = sum(t.amount_cents for t in transactions)
    total_fees_cents = sum(t.platform_fee_cents for t in transactions)
    net_earnings_cents = total_revenue_cents - total_fees_cents

    # Calculate next payout date (next Monday)
    from datetime import datetime, timedelta
    today = datetime.utcnow()
    days_until_monday = (PAYOUT_DAY - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7  # If today is Monday, next payout is next Monday
    next_payout_date = (today + timedelta(days=days_until_monday)).date().isoformat()

    return {
        "total_sales": total_sales,
        "total_revenue_cents": total_revenue_cents,
        "total_fees_cents": total_fees_cents,
        "net_earnings_cents": net_earnings_cents,
        "platform_fee_percent": int(PLATFORM_FEE_PERCENT * 100),
        "payout_schedule": "weekly",
        "next_payout_date": next_payout_date,
        "pending_payout_cents": net_earnings_cents,  # All earnings pending until payout day
        "stripe_connect_status": current_user.stripe_status if current_user.stripe_connect_id else "not_started"
    }


# ==================== STRIPE CONNECT ONBOARDING ====================

@router.post("/connect/onboard")
async def create_connect_account(
    request: Request,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Create Stripe Connect account and return onboarding URL"""

    if not current_user.is_developer:
        raise HTTPException(status_code=403, detail="Only developers can connect Stripe accounts")

    try:
        # Create Stripe Connect Express account
        account = stripe.Account.create(
            type='express',
            country='US',
            email=current_user.email,
            capabilities={
                'transfers': {'requested': True},
                'card_payments': {'requested': True}
            },
            business_type='individual',
            metadata={
                'user_id': str(current_user.id),
                'platform': 'agent-resources'
            }
        )

        # Update user with Stripe Connect ID
        current_user.stripe_connect_id = account.id
        current_user.stripe_status = 'pending'
        session.commit()

        # Create onboarding link — return_url points to frontend, not API
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f'{frontend_url}/settings?tab=payouts&refresh=1',
            return_url=f'{frontend_url}/connect/return?account_id={account.id}',
            type='account_onboarding'
        )

        return {
            "onboarding_url": account_link.url,
            "account_id": account.id,
            "status": "pending"
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/connect/status")
async def get_connect_status(
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Get Stripe Connect account status"""

    if not current_user.is_developer:
        raise HTTPException(status_code=403, detail="Only developers can view Stripe status")

    if not current_user.stripe_connect_id:
        return {
            "connected": False,
            "status": "not_started",
            "message": "Stripe account not connected"
        }

    try:
        # Fetch latest account status from Stripe
        account = stripe.Account.retrieve(current_user.stripe_connect_id)

        # Update local status
        current_user.stripe_charges_enabled = account.charges_enabled
        current_user.stripe_payouts_enabled = account.payouts_enabled

        if account.charges_enabled and account.payouts_enabled:
            current_user.stripe_status = 'active'
        elif current_user.stripe_status != 'active':
            current_user.stripe_status = 'pending'

        session.commit()

        return {
            "connected": True,
            "status": current_user.stripe_status,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "account_id": current_user.stripe_connect_id,
            "requirements": account.requirements.currently_due if hasattr(account, 'requirements') else []
        }

    except stripe.error.StripeError as e:
        return {
            "connected": False,
            "status": "error",
            "message": str(e)
        }


@router.post("/connect/refresh")
async def refresh_connect_link(
    request: Request,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Refresh Stripe Connect onboarding link"""

    if not current_user.is_developer or not current_user.stripe_connect_id:
        raise HTTPException(status_code=400, detail="No Stripe account found")

    try:
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        account_link = stripe.AccountLink.create(
            account=current_user.stripe_connect_id,
            refresh_url=f'{frontend_url}/settings?tab=payouts&refresh=1',
            return_url=f'{frontend_url}/connect/return?account_id={current_user.stripe_connect_id}',
            type='account_onboarding'
        )

        return {"onboarding_url": account_link.url}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/connect/return")
async def connect_return(
    account_id: str,
    current_user: User = Depends(get_current_user_from_token),
    session = Depends(get_session)
):
    """Handle Stripe Connect onboarding return"""

    # Verify the account_id belongs to the authenticated user
    user = session.exec(
        select(User).where(User.stripe_connect_id == account_id)
    ).first()

    if not user or str(user.id) != str(current_user.id):
        raise HTTPException(status_code=404, detail="Account not found")

    try:
        # Check account status
        account = stripe.Account.retrieve(account_id)

        user.stripe_charges_enabled = account.charges_enabled
        user.stripe_payouts_enabled = account.payouts_enabled

        if account.charges_enabled and account.payouts_enabled:
            user.stripe_status = 'active'
        else:
            user.stripe_status = 'pending'

        session.commit()

        # Pay out any bonuses that were earned before Stripe Connect was set up
        bonuses_paid = 0
        if user.stripe_status == 'active':
            from models import Listing
            pending_bonus_listings = session.exec(
                select(Listing).where(
                    Listing.owner_id == user.id,
                    Listing.developer_code != None,
                    Listing.bonus_paid == False,
                )
            ).all()

            for listing in pending_bonus_listings:
                # Only pay if this listing actually had a sale
                had_sale = session.exec(
                    select(Transaction).where(
                        Transaction.product_id == listing.product_id,
                        Transaction.status == "completed"
                    )
                ).first()
                if not had_sale:
                    continue
                try:
                    stripe.Transfer.create(
                        amount=2000,
                        currency="usd",
                        destination=user.stripe_connect_id,
                        description=f"First-sale bonus (deferred) for listing: {listing.name}",
                        metadata={
                            "listing_id": str(listing.id),
                            "developer_code": listing.developer_code,
                        }
                    )
                    listing.bonus_paid = True
                    bonuses_paid += 1
                    print(f"[BONUS] Deferred $20 transfer for listing {listing.id}")
                except stripe.error.StripeError as bonus_err:
                    print(f"[BONUS ERROR] Deferred transfer failed for listing {listing.id}: {bonus_err}")

            if bonuses_paid:
                session.commit()

        return {
            "status": "success",
            "account_status": user.stripe_status,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "deferred_bonuses_paid": bonuses_paid,
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
