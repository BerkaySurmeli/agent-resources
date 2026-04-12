from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
import stripe
from sqlmodel import select
from core.config import settings
from core.database import get_session
from models import User, Listing, Transaction

router = APIRouter(prefix="/payments", tags=["Payments"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Platform fee: 15%
PLATFORM_FEE_PERCENT = 0.15

@router.post("/connect/onboard")
def create_connect_account(
    request: Request,
    session = Depends(get_session)
):
    """Create a Stripe Connect Express account for the current user"""
    # Get current user from auth token
    from routes.auth import get_current_user
    current_user = get_current_user(request, session)
    
    if current_user.stripe_connect_id:
        # Already has an account, return onboarding link
        account_link = stripe.AccountLink.create(
            account=current_user.stripe_connect_id,
            refresh_url='https://shopagentresources.com/dashboard?stripe=refresh',
            return_url='https://shopagentresources.com/dashboard?stripe=success',
            type='account_onboarding',
        )
        return {"url": account_link.url}
    
    # Create new Connect Express account
    try:
        account = stripe.Account.create(
            type='express',
            country='US',
            email=current_user.email,
            capabilities={
                'card_payments': {'requested': True},
                'transfers': {'requested': True},
            },
            business_type='individual',
            metadata={
                'user_id': str(current_user.id),
                'user_email': current_user.email
            }
        )
        
        # Save account ID to user
        current_user.stripe_connect_id = account.id
        current_user.stripe_status = 'pending'
        session.commit()
        
        # Create onboarding link
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url='https://shopagentresources.com/dashboard?stripe=refresh',
            return_url='https://shopagentresources.com/dashboard?stripe=success',
            type='account_onboarding',
        )
        
        return {"url": account_link.url, "account_id": account.id}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/connect/status")
def get_connect_status(
    request: Request,
    session = Depends(get_session)
):
    """Get Stripe Connect account status"""
    from routes.auth import get_current_user
    current_user = get_current_user(request, session)
    
    if not current_user.stripe_connect_id:
        return {"status": "not_started", "onboarded": False}
    
    try:
        account = stripe.Account.retrieve(current_user.stripe_connect_id)
        
        # Update user record
        current_user.stripe_charges_enabled = account.charges_enabled
        current_user.stripe_payouts_enabled = account.payouts_enabled
        current_user.stripe_status = 'active' if account.charges_enabled else 'pending'
        session.commit()
        
        return {
            "status": current_user.stripe_status,
            "onboarded": account.charges_enabled,
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "account_id": current_user.stripe_connect_id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-checkout-session")
def create_checkout_session(
    listing_id: str,
    email: str,
    session = Depends(get_session)
):
    """Create Stripe checkout session for a listing with Stripe Connect"""
    
    # Get listing
    from uuid import UUID
    try:
        listing_uuid = UUID(listing_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid listing ID")
    
    listing = session.get(Listing, listing_uuid)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Get seller
    seller = session.get(User, listing.owner_id)
    if not seller or not seller.stripe_connect_id:
        raise HTTPException(status_code=400, detail="Seller not set up for payments")
    
    # Calculate amounts
    total_cents = listing.price_cents
    platform_fee_cents = int(total_cents * PLATFORM_FEE_PERCENT)
    seller_amount_cents = total_cents - platform_fee_cents
    
    try:
        # Create checkout session with Connect
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': listing.name},
                    'unit_amount': total_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'https://shopagentresources.com/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'https://shopagentresources.com/listings/{listing.slug}',
            customer_email=email,
            payment_intent_data={
                'application_fee_amount': platform_fee_cents,
                'transfer_data': {
                    'destination': seller.stripe_connect_id,
                },
            },
            metadata={
                'listing_id': str(listing.id),
                'seller_id': str(seller.id),
                'customer_email': email,
                'platform_fee_cents': str(platform_fee_cents),
                'seller_amount_cents': str(seller_amount_cents)
            }
        )
        
        return {"session_id": checkout_session.id, "url": checkout_session.url}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
def stripe_webhook(request: Request):
    """Handle Stripe webhooks for payment events"""
    payload = request.body()
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
        session = event['data']['object']
        
        # Get metadata
        listing_id = session.get('metadata', {}).get('listing_id')
        seller_id = session.get('metadata', {}).get('seller_id')
        customer_email = session.get('customer_email')
        platform_fee_cents = int(session.get('metadata', {}).get('platform_fee_cents', 0))
        
        if listing_id and seller_id:
            # Create transaction record
            from uuid import UUID
            from datetime import datetime
            
            db_session = next(get_session())
            try:
                transaction = Transaction(
                    buyer_id=None,  # Will be set if user is logged in
                    seller_id=UUID(seller_id),
                    product_id=UUID(listing_id),
                    amount_cents=session['amount_total'],
                    platform_fee_cents=platform_fee_cents,
                    stripe_payment_intent_id=session['payment_intent'],
                    status='completed'
                )
                db_session.add(transaction)
                db_session.commit()
                
                # Check if this is seller's first sale for developer bonus
                seller = db_session.get(User, UUID(seller_id))
                if seller and seller.developer_code and not seller.first_sale_bonus_paid:
                    # This is their first sale - mark bonus as pending
                    # Actual payout would be handled by admin or automated job
                    seller.first_sale_bonus_paid = True
                    db_session.commit()
                    
            finally:
                db_session.close()
    
    return {"status": "success"}
