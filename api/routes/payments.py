from fastapi import APIRouter, HTTPException
import stripe
from core.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/create-checkout-session")
def create_checkout_session(product_slug: str, email: str):
    """Create Stripe checkout session for a product"""
    
    # Product price mapping (in cents)
    prices = {
        "claudia-project-manager": 4900,
        "chen-developer": 5900,
        "adrian-ux-designer": 4900,
        "dream-team-bundle": 9900
    }
    
    product_names = {
        "claudia-project-manager": "Claudia - AI Project Manager",
        "chen-developer": "Chen - AI Developer",
        "adrian-ux-designer": "Adrian - AI UX Designer",
        "dream-team-bundle": "The Dream Team Bundle"
    }
    
    if product_slug not in prices:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': product_names[product_slug],
                    },
                    'unit_amount': prices[product_slug],
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'https://shopagentresources.com/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'https://shopagentresources.com/cancel',
            customer_email=email,
            metadata={
                'product_slug': product_slug,
                'customer_email': email
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
            "product_slug": session.metadata.get("product_slug")
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
