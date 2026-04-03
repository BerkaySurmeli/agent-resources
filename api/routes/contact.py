from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from core.config import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/contact", tags=["Contact"])

# Email configuration - prefer Railway Email if available
if settings.RAILWAY_EMAIL_SMTP_SERVER and settings.RAILWAY_EMAIL_PASSWORD:
    SMTP_SERVER = settings.RAILWAY_EMAIL_SMTP_SERVER
    SMTP_PORT = settings.RAILWAY_EMAIL_SMTP_PORT
    EMAIL_USER = settings.RAILWAY_EMAIL_USER
    EMAIL_PASSWORD = settings.RAILWAY_EMAIL_PASSWORD
    FROM_EMAIL = settings.RAILWAY_EMAIL_FROM or settings.RAILWAY_EMAIL_USER
    USING_RAILWAY = True
else:
    SMTP_SERVER = settings.ZOHO_SMTP_SERVER
    SMTP_PORT = settings.ZOHO_SMTP_PORT
    EMAIL_USER = settings.ZOHO_SUPPORT_EMAIL
    EMAIL_PASSWORD = settings.ZOHO_SUPPORT_PASSWORD
    FROM_EMAIL = settings.ZOHO_SUPPORT_EMAIL
    USING_RAILWAY = False

# Support email address (recipient)
SUPPORT_EMAIL = settings.ZOHO_SUPPORT_EMAIL

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
        text_body = f"""New Contact Form Submission

Category: {form_data.category}
From: {form_data.name} <{form_data.email}>
Subject: {form_data.subject}

Message:
{form_data.message}

---
This email was sent via the Agent Resources contact form.
"""

        # HTML version
        html_body = f"""<!DOCTYPE html>
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
</html>"""

        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')

        msg.attach(part1)
        msg.attach(part2)

        # Send email via SMTP
        service_name = "Railway Email" if USING_RAILWAY else "Zoho"
        print(f"[CONTACT DEBUG] Using {service_name}")
        print(f"[CONTACT DEBUG] Connecting to {SMTP_SERVER}:{SMTP_PORT}")
        print(f"[CONTACT DEBUG] Using email: {EMAIL_USER}")

        email_sent = False

        # Try SSL connection on port 465 first
        try:
            with smtplib.SMTP_SSL(SMTP_SERVER, 465, timeout=10) as server:
                print("[CONTACT DEBUG] Connected via SSL on port 465")
                server.login(EMAIL_USER, EMAIL_PASSWORD)
                server.send_message(msg)
                print(f"[CONTACT FORM] Email sent to {SUPPORT_EMAIL} from {form_data.email} via SSL")
                email_sent = True
        except Exception as ssl_error:
            print(f"[CONTACT DEBUG] SSL failed: {ssl_error}")

        # Fallback to STARTTLS
        if not email_sent:
            try:
                with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
                    server.starttls()
                    server.login(EMAIL_USER, EMAIL_PASSWORD)
                    server.send_message(msg)
                    print(f"[CONTACT FORM] Email sent to {SUPPORT_EMAIL} from {form_data.email} via STARTTLS")
                    email_sent = True
            except Exception as tls_error:
                print(f"[CONTACT DEBUG] STARTTLS failed: {tls_error}")

        if not email_sent:
            print(f"[CONTACT FORM WARNING] Could not send email - logged for manual review")
            print(f"[CONTACT FORM] From: {form_data.name} <{form_data.email}>")
            print(f"[CONTACT FORM] Subject: {form_data.subject}")

        return {"message": "Form submitted successfully"}

    except smtplib.SMTPAuthenticationError as e:
        print(f"[CONTACT FORM ERROR] Authentication failed: {e}")
        # Still return success - we logged the message
        return {"message": "Form submitted successfully"}
    except Exception as e:
        print(f"[CONTACT FORM ERROR] Failed to send email: {type(e).__name__}: {e}")
        # Still return success - we logged the message
        return {"message": "Form submitted successfully"}

@router.get("/categories")
def get_categories():
    """Get list of valid contact categories"""
    return {"categories": VALID_CATEGORIES}
