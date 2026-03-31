from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/contact", tags=["Contact"])

# Zoho Mail configuration (same as auth.py)
ZOHO_SMTP_SERVER = os.getenv("ZOHO_SMTP_SERVER", "smtp.zoho.com")
ZOHO_SMTP_PORT = int(os.getenv("ZOHO_SMTP_PORT", "587"))
ZOHO_EMAIL = os.getenv("ZOHO_EMAIL", "info@shopagentresources.com")
ZOHO_PASSWORD = os.getenv("ZOHO_PASSWORD", "")

# Support email address
SUPPORT_EMAIL = "support@shopagentresources.com"

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    category: str
    subject: str
    message: str

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
    
    # Validate required fields
    if not form_data.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")
    if not form_data.subject.strip():
        raise HTTPException(status_code=400, detail="Subject is required")
    if not form_data.message.strip():
        raise HTTPException(status_code=400, detail="Message is required")
    
    # Check if Zoho is configured
    if not ZOHO_PASSWORD:
        print(f"[CONTACT FORM] Zoho password not configured, logging submission only")
        print(f"[CONTACT FORM] From: {form_data.name} <{form_data.email}>")
        print(f"[CONTACT FORM] Category: {form_data.category}")
        print(f"[CONTACT FORM] Subject: {form_data.subject}")
        print(f"[CONTACT FORM] Message: {form_data.message[:200]}...")
        return {"message": "Form submitted successfully (email not sent - Zoho not configured)"}
    
    try:
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"[{form_data.category}] {form_data.subject}"
        msg['From'] = f"Agent Resources Contact Form <{ZOHO_EMAIL}>"
        msg['To'] = SUPPORT_EMAIL
        msg['Reply-To'] = f"{form_data.name} <{form_data.email}>"

        # Plain text version
        text_body = f"""
New Contact Form Submission

Category: {form_data.category}
From: {form_data.name} <{form_data.email}>
Subject: {form_data.subject}

Message:
{form_data.message}

---
This email was sent via the Agent Resources contact form.
"""

        # HTML version
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin-top: 0;">New Contact Form Submission</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="padding: 8px 0; color: #64748b; width: 100px;">Category:</td>
                <td style="padding: 8px 0; font-weight: 500;">{form_data.category}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #64748b;">From:</td>
                <td style="padding: 8px 0; font-weight: 500;">{form_data.name} &lt;{form_data.email}&gt;</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #64748b;">Subject:</td>
                <td style="padding: 8px 0; font-weight: 500;">{form_data.subject}</td>
            </tr>
        </table>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <h3 style="color: #0f172a; margin-top: 0;">Message:</h3>
        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap;">{form_data.message}</div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            This email was sent via the Agent Resources contact form.<br>
            Reply directly to this email to respond to {form_data.name}.
        </p>
    </div>
</body>
</html>
"""

        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')

        msg.attach(part1)
        msg.attach(part2)

        # Send email via Zoho SMTP
        with smtplib.SMTP(ZOHO_SMTP_SERVER, ZOHO_SMTP_PORT) as server:
            server.starttls()
            server.login(ZOHO_EMAIL, ZOHO_PASSWORD)
            server.send_message(msg)

        print(f"[CONTACT FORM] Email sent to {SUPPORT_EMAIL} from {form_data.email}")
        return {"message": "Form submitted successfully"}
        
    except Exception as e:
        print(f"[CONTACT FORM ERROR] Failed to send email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message. Please try again later.")

@router.get("/categories")
def get_categories():
    """Get list of valid contact categories"""
    return {"categories": VALID_CATEGORIES}
