from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from sqlmodel import select
import stripe
from datetime import datetime
import uuid

from core.config import settings
from core.database import get_session
from models import User, Listing, Product, Transaction, ListingStatus
from routes.auth import get_current_user_from_token
from services.email import send_purchase_confirmation, send_sale_notification

router = APIRouter(prefix="/payments", tags=["Payments"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET

# Platform fee percentage (10%)
PLATFORM_FEE_PERCENT = 0.10

# Payout schedule: weekly on Mondays
PAYOUT_DAY = 0  # Monday (0=Monday, 6=Sunday)


class CartItem(BaseModel):
    listing_id: str
    quantity: int = 1


class CreateCheckoutRequest(BaseModel):
    items: List[CartItem]
    email: str
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    session_id: str
    url: str


@router.post("/create-checkout-session", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CreateCheckoutRequest,
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
            customer_email=request.email,
            metadata={
                'listing_ids': ','.join(listing_ids),
                'customer_email': request.email,
                'platform': 'agent-resources'
            }
        )
        
        return {
            "session_id": checkout_session.id,
            "url": checkout_session.url
        }
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """Handle Stripe webhook events"""
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
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
    
    from core.database import get_session
    db_session = next(get_session())
    
    try:
        listing_ids_str = session_data.get('metadata', {}).get('listing_ids', '')
        customer_email = session_data.get('customer_email')
        stripe_payment_intent_id = session_data.get('payment_intent')
        
        if not listing_ids_str:
            print("[WEBHOOK] No listing IDs in session metadata")
            return
        
        listing_ids = listing_ids_str.split(',')
        
        # Find or create user
        user = db_session.exec(
            select(User).where(User.email == customer_email)
        ).first()
        
        if not user:
            # Create user account for guest checkout
            user = User(
                email=customer_email,
                name=customer_email.split('@')[0],
                is_verified=True  # Auto-verify since they paid
            )
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
        
        # Create transactions for each listing
        for listing_id in listing_ids:
            listing = db_session.exec(
                select(Listing).where(Listing.id == listing_id)
            ).first()
            
            if not listing:
                continue
            
            # Calculate fees
            total_amount_cents = listing.price_cents
            platform_fee_cents = int(total_amount_cents * PLATFORM_FEE_PERCENT)
            seller_amount_cents = total_amount_cents - platform_fee_cents
            
            # Create transaction record
            transaction = Transaction(
                id=uuid.uuid4(),
                buyer_id=user.id,
                seller_id=listing.owner_id,
                product_id=listing.product_id,  # Link to published product
                amount_cents=total_amount_cents,
                platform_fee_cents=platform_fee_cents,
                stripe_payment_intent_id=stripe_payment_intent_id,
                status="completed"
            )
            
            db_session.add(transaction)
            
            # Increment download count on product
            if listing.product_id:
                product = db_session.exec(
                    select(Product).where(Product.id == listing.product_id)
                ).first()
                if product:
                    product.download_count += 1
            
            # Send emails in background
            background_tasks.add_task(
                send_purchase_confirmation,
                customer_email,
                listing.name,
                total_amount_cents / 100
            )
            
            # Get seller email for notification
            seller = db_session.exec(
                select(User).where(User.id == listing.owner_id)
            ).first()
            if seller:
                background_tasks.add_task(
                    send_sale_notification,
                    seller.email,
                    listing.name,
                    seller_amount_cents / 100
                )
        
        db_session.commit()
        print(f"[WEBHOOK] Processed payment for {len(listing_ids)} items")
        
    except Exception as e:
        print(f"[WEBHOOK ERROR] {e}")
        import traceback
        traceback.print_exc()
        db_session.rollback()
    finally:
        db_session.close()


@router.get("/session/{session_id}")
async def get_session(session_id: str, session = Depends(get_session)):
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
        "pending_payout_cents": net_earnings_cents  # All earnings pending until payout day
    }