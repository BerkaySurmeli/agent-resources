from fastapi import APIRouter, HTTPException
from typing import List
import stripe
from core.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

# Product catalog
PRODUCTS = {
    "claudia-project-manager": {"name": "Claudia - AI Project Manager", "price": 4900},
    "chen-developer": {"name": "Chen - AI Developer", "price": 5900},
    "adrian-ux-designer": {"name": "Adrian - AI UX Designer", "price": 4900},
    "dream-team-bundle": {"name": "The Dream Team Bundle", "price": 9900},
    "content-marketer": {"name": "Maya - Content Marketer", "price": 3900},
    "financial-analyst": {"name": "Finn - Financial Analyst", "price": 4500},
    "hr-specialist": {"name": "Hannah - HR Specialist", "price": 3500},
    "operations-manager": {"name": "Oliver - Operations Manager", "price": 4200},
}

@router.post("/create-checkout-session")
def create_checkout_session(product_slug: str, email: str):
    """Create Stripe checkout session for a single product"""
    
    if product_slug not in PRODUCTS:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product = PRODUCTS[product_slug]
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {'name': product['name']},
                    'unit_amount': product['price'],
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'https://shopagentresources.com/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'https://shopagentresources.com/cart',
            customer_email=email,
            metadata={
                'product_slug': product_slug,
                'customer_email': email
            }
        )
        
        return {"session_id": session.id, "url": session.url}
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/create-cart-checkout")
def create_cart_checkout(items: List[str], email: str, discount: int = 0):
    """Create Stripe checkout session for multiple items (cart)"""
    
    line_items = []
    total_amount = 0
    
    for slug in items:
        if slug not in PRODUCTS:
            continue
        product = PRODUCTS[slug]
        line_items.append({
            'price_data': {
                'currency': 'usd',
                'product_data': {'name': product['name']},
                'unit_amount': product['price'],
            },
            'quantity': 1,
        })
        total_amount += product['price']
    
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
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=f'https://shopagentresources.com/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'https://shopagentresources.com/cart',
            customer_email=email,
            metadata={
                'items': ','.join(items),
                'customer_email': email,
                'discount': str(discount)
            }
        )
        
        return {"session_id": session.id, "url": session.url}
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/session/{session_id}")
def get_session(session_id: str):
    """Get checkout session details"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        return {
            "status": session.payment_status,
            "customer_email": session.customer_email,
            "items": session.metadata.get("items", "").split(",") if session.metadata else []
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
