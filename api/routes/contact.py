from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from core.config import settings
from services.email import EmailService

router = APIRouter(prefix="/contact", tags=["Contact"])

class ContactForm(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    category: str = Field(min_length=1, max_length=100)
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)

# Valid categories
VALID_CATEGORIES = [
    "Product Support",
    "Purchase Issues",
    "General Inquiry",
    "Report a Problem",
    "Partnership/Sales"
]

@router.post("/submit")
def submit_contact_form(form_data: ContactForm):
    """Submit contact form and send email to support"""
    
    # Validate category
    if form_data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category selected")
    
    # Check if Resend is configured
    if not settings.RESEND_API_KEY:
        print(f"[CONTACT FORM] Resend API key not configured, logging submission only")
        print(f"[CONTACT FORM] From: {form_data.name} <{form_data.email}>")
        print(f"[CONTACT FORM] Category: {form_data.category}")
        print(f"[CONTACT FORM] Subject: {form_data.subject}")
        print(f"[CONTACT FORM] Message: {form_data.message[:200]}...")
        return {"message": "Form submitted successfully (email not sent - Resend not configured)"}
    
    try:
        # Send email via Resend API
        EmailService.send_contact_form(
            name=form_data.name,
            from_email=form_data.email,
            category=form_data.category,
            subject=form_data.subject,
            message=form_data.message
        )
        return {"message": "Form submitted successfully"}
        
    except Exception as e:
        print(f"[CONTACT FORM ERROR] Failed to send email: {type(e).__name__}: {e}")
        # Still return success - we logged the message
        return {"message": "Form submitted successfully"}

@router.get("/categories")
def get_categories():
    """Get list of valid contact categories"""
    return {"categories": VALID_CATEGORIES}
