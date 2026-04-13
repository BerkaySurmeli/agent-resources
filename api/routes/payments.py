from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List
import stripe
from sqlmodel import select
from core.config import settings
from core.database import get_session
from models import Listing, User, Transaction, Product
import uuid
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["Payments"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

def get_listing_by_slug(session, slug: str) -> Listing:
    """Get listing from database by slug"""
    listing = session.exec(
        select(Listing).where(Listing.slug == slug, Listing.status == 'approved')
    ).first()
    return listing

def record_purchase(session, listing: Listing, buyer_email: str, stripe_payment_intent_id: str, amount_cents: int):
    """Record a purchase transaction in the database"""
    # Find or create buyer user
    buyer = session.exec(select(User).where(User.email == buyer_email)).first()
    if not buyer:
        buyer = User(email=buyer_email, id=uuid.uuid4())
        session.add(buyer)
        session.commit()
        session.refresh(buyer)
    
    # Get seller (listing owner)
    seller = session.get(User, listing.owner_id)
    if not seller:
        return None
    
    # Get or create product for this listing
    product = session.exec(select(Product).where(Product.id == listing.product_id)).first() if listing.product_id else None
    if not product:
        # Create product from listing
        product = Product(
            id=uuid.uuid4(),
            name=listing.name,
            slug=listing.slug,
            description=listing.description,
            category=listing.category,
            price_cents=listing.price_cents,
            developer_id=listing.owner_id,
            is_active=True
        )
        session.add(product)
        session.commit()
        session.refresh(product)
        # Update listing with product_id
        listing.product_id = product.id
        session.commit()
    
    # Calculate platform fee (15%)
    platform_fee_cents = int(amount_cents * 0.15)
    
    # Create transaction record
    transaction = Transaction(
        id=uuid.uuid4(),
        buyer_id=buyer.id,
        seller_id=listing.owner_id,
        product_id=product.id,
        amount_cents=amount_cents,
        platform_fee_cents=platform_fee_cents,
        stripe_payment_intent_id=stripe_payment_intent_id,
        status='completed',
        created_at=datetime.utcnow()
    )
    session.add(transaction)
    session.commit()
    return transaction

@router.post("/create-checkout-session")
def create_checkout_session(
    product_slug: str, 
    email: str,
    session = Depends(get_session)
):
    """Create Stripe checkout session for a single product (dynamic from listings)"""
    
    # Look up listing from database
    listing = get_listing_by_slug(session, product_slug)
    if not listing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        stripe_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': listing.name},
                    'unit_amount': listing.price_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{settings.FRONTEND_URL}/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{settings.FRONTEND_URL}/cart',
            customer_email=email,
            metadata={
                'product_slug': product_slug,
                'listing_id': str(listing.id),
                'customer_email': email,
                'type': 'single_purchase'
            }
        )
        
        return {"session_id": stripe_session.id, "url": stripe_session.url}
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-cart-checkout")
def create_cart_checkout(
    items: List[str], 
    email: str, 
    discount: int = 0,
    session = Depends(get_session)
):
    """Create Stripe checkout session for multiple items (cart) - dynamic from listings"""
    
    line_items = []
    total_amount = 0
    valid_slugs = []
    
    for slug in items:
        listing = get_listing_by_slug(session, slug)
        if not listing:
            continue
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {'name': listing.name},
                'unit_amount': listing.price_cents,
            },
            'quantity': 1,
        })
        total_amount += listing.price_cents
        valid_slugs.append(slug)
    
    if not line_items:
        raise HTTPException(status_code=400, detail="No valid items in cart")
    
    # Apply discount if any
    if discount > 0:
        discount_amount = min(discount, total_amount - 100)  # Keep at least $1
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {'name': 'Bundle Discount'},
                'unit_amount': -discount_amount,  # Negative for discount
            },
            'quantity': 1,
        })
    
    try:
        stripe_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=f'{settings.FRONTEND_URL}/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{settings.FRONTEND_URL}/cart',
            customer_email=email,
            metadata={
                'items': ','.join(valid_slugs),
                'customer_email': email,
                'discount': str(discount),
                'type': 'cart_checkout'
            }
        )
        
        return {"session_id": stripe_session.id, "url": stripe_session.url}
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/session/{session_id}")
def get_session_status(session_id: str, session = Depends(get_session)):
    """Get checkout session details and record purchase if paid"""
    try:
        stripe_session = stripe.checkout.Session.retrieve(session_id)
        
        # If payment successful, record the purchase
        if stripe_session.payment_status == 'paid':
            product_slug = stripe_session.metadata.get('product_slug')
            items = stripe_session.metadata.get('items', '').split(',') if stripe_session.metadata.get('items') else []
            customer_email = stripe_session.customer_email
            
            # Record single purchase
            if product_slug:
                listing = get_listing_by_slug(session, product_slug)
                if listing:
                    # Check if already recorded
                    existing = session.exec(
                        select(Purchase).where(
                            Purchase.stripe_payment_intent_id == stripe_session.payment_intent
                        )
                    ).first()
                    if not existing:
                        record_purchase(session, listing, customer_email, stripe_session.payment_intent, listing.price_cents)
            
            # Record cart purchases
            for slug in items:
                if slug:
                    listing = get_listing_by_slug(session, slug)
                    if listing:
                        existing = session.exec(
                            select(Purchase).where(
                                Purchase.stripe_payment_intent_id == stripe_session.payment_intent,
                                Purchase.listing_id == listing.id
                            )
                        ).first()
                        if not existing:
                            record_purchase(session, listing, customer_email, stripe_session.payment_intent, listing.price_cents)
        
        return {
            "status": stripe_session.payment_status,
            "customer_email": stripe_session.customer_email,
            "items": stripe_session.metadata.get("items", "").split(",") if stripe_session.metadata else []
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, session = Depends(get_session)):
    """Handle Stripe webhook events"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle checkout completion
    if event['type'] == 'checkout.session.completed':
        stripe_session = event['data']['object']
        product_slug = stripe_session.metadata.get('product_slug')
        items = stripe_session.metadata.get('items', '').split(',') if stripe_session.metadata.get('items') else []
        customer_email = stripe_session.customer_email
        
        # Record single purchase
        if product_slug:
            listing = get_listing_by_slug(session, product_slug)
            if listing:
                record_purchase(session, listing, customer_email, stripe_session.payment_intent, listing.price_cents)
        
        # Record cart purchases
        for slug in items:
            if slug:
                listing = get_listing_by_slug(session, slug)
                if listing:
                    record_purchase(session, listing, customer_email, stripe_session.payment_intent, listing.price_cents)
    
    return {"status": "success"}
