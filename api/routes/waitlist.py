from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import Session, select, create_engine
from models import WaitlistEntry
from core.config import settings
import resend
import secrets

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])

class WaitlistRequest(BaseModel):
    email: str
    source: str = "website"

def get_db_session():
    engine = create_engine(settings.DATABASE_URL)
    return Session(engine)

def generate_developer_code():
    """Generate a unique developer code"""
    return f"DEV-{secrets.token_hex(4).upper()}"

def send_welcome_email(email: str, code: str):
    """Send welcome email with developer code for first 50"""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Would send to {email} with code {code}")
        return
    
    try:
        resend.api_key = settings.RESEND_API_KEY
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background: #2563eb; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">AR</div>
                    <div style="margin-top: 10px; font-size: 18px; font-weight: 600; color: #1f2937;">Agent Resources</div>
                </div>
                
                <h1 style="color: #2563eb;">Welcome to Agent Resources!</h1>
                
                <p>Your spot is secured. We'll notify you when the marketplace is ready.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">Your Developer Code</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px;">{code}</p>
                    <p style="margin-bottom: 0;">Use this code when creating your first listing to get $20 after your first sale!</p>
                </div>
                
                <p>As one of our first 50 developers, you're eligible for:</p>
                <ul>
                    <li>$20 bonus after your first sale</li>
                </ul>
                
                <p>Stay tuned for updates!</p>
                
                <p style="color: #6b7280; font-size: 14px;">
                    — The Agent Resources Team<br>
                    <a href="https://shopagentresources.com">shopagentresources.com</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        resend.Emails.send({
            "from": settings.FROM_EMAIL_SUPPORT,
            "to": email,
            "subject": "Welcome to Agent Resources - Your Developer Code Inside!",
            "html": html_content
        })
        print(f"[EMAIL] Welcome email sent to {email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {email}: {e}")

def send_waitlist_email(email: str):
    """Send waitlist email for 51st and beyond"""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Would send waitlist email to {email}")
        return
    
    try:
        resend.api_key = settings.RESEND_API_KEY
        
        html_content = """
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background: #2563eb; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">AR</div>
                    <div style="margin-top: 10px; font-size: 18px; font-weight: 600; color: #1f2937;">Agent Resources</div>
                </div>
                
                <h1 style="color: #2563eb;">You're on the list!</h1>
                
                <p>Thanks for your interest in Agent Resources. We've filled all 50 early developer spots, but you're still on our waitlist.</p>
                
                <p>We'll notify you as soon as the marketplace is live so you can start selling your AI personas, skills, and MCP servers.</p>
                
                <p>Stay tuned for updates!</p>
                
                <p style="color: #6b7280; font-size: 14px;">
                    — The Agent Resources Team<br>
                    <a href="https://shopagentresources.com">shopagentresources.com</a>
                </p>
            </div>
        </body>
        </html>
        """
        
        resend.Emails.send({
            "from": settings.FROM_EMAIL_SUPPORT,
            "to": email,
            "subject": "You're on the Agent Resources waitlist!",
            "html": html_content
        })
        print(f"[EMAIL] Waitlist email sent to {email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {email}: {e}")

@router.post("/")
@router.post("")
def join_waitlist(request: WaitlistRequest):
    """Add email to waitlist"""
    session = get_db_session()
    
    # Check if already exists
    existing = session.exec(select(WaitlistEntry).where(WaitlistEntry.email == request.email)).first()
    if existing:
        session.close()
        return {"status": "already_registered", "message": "You're already on the waitlist!"}
    
    # Get current count before adding
    current_count = len(session.exec(select(WaitlistEntry)).all())
    is_in_first_50 = current_count < 50
    
    # Generate developer code only for first 50
    developer_code = generate_developer_code() if is_in_first_50 else None
    
    # Create new entry
    entry = WaitlistEntry(
        email=request.email,
        source=request.source,
        developer_code=developer_code
    )
    session.add(entry)
    session.commit()
    
    # Get updated count
    count = len(session.exec(select(WaitlistEntry)).all())
    
    session.close()
    
    # Send appropriate email
    if is_in_first_50 and developer_code:
        send_welcome_email(request.email, developer_code)
    else:
        send_waitlist_email(request.email)
    
    if is_in_first_50:
        return {
            "status": "success",
            "message": "You've been added to the waitlist! Check your email for your developer code.",
            "developer_code": developer_code,
            "spots_remaining": max(0, 50 - count)
        }
    else:
        return {
            "status": "success",
            "message": "You've been added to the waitlist! We'll notify you when we're live.",
            "spots_remaining": max(0, 50 - count)
        }

@router.get("/count")
@router.get("/count/")
def get_waitlist_count():
    """Get total waitlist count"""
    session = get_db_session()
    entries = session.exec(select(WaitlistEntry)).all()
    count = len(entries)
    session.close()
    return {"count": count, "spots_remaining": max(0, 50 - count)}

@router.post("/delete/")
def delete_from_waitlist(request: WaitlistRequest):
    """Delete email from waitlist (admin only)"""
    session = get_db_session()
    entry = session.exec(select(WaitlistEntry).where(WaitlistEntry.email == request.email)).first()
    
    if entry:
        session.delete(entry)
        session.commit()
        session.close()
        return {"status": "success", "message": f"{request.email} removed from waitlist"}
    
    session.close()
    return {"status": "not_found", "message": "Email not found in waitlist"}
