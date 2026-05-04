from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from sqlmodel import select
from models import WaitlistEntry
from core.config import settings
from core.database import get_session
import resend
import secrets

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])

class WaitlistRequest(BaseModel):
    email: str
    source: str = "website"

def generate_developer_code():
    return f"DEV-{secrets.token_hex(4).upper()}"

def send_welcome_email(email: str, code: str):
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Would send to {email} with code {code}")
        return

    try:
        resend.api_key = settings.RESEND_API_KEY
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Welcome to Agent Resources!</h1>
                <p>Your spot is secured. We'll notify you when the marketplace is ready.</p>
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="margin-top: 0;">Your Developer Code</h2>
                    <p style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px;">{code}</p>
                    <p style="margin-bottom: 0;">Use this code when creating your first listing to get $20 after your first sale!</p>
                </div>
                <p>As one of our first 50 developers, you're eligible for:</p>
                <ul>
                    <li>✓ List your first item free</li>
                    <li>✓ $20 bonus after your first sale</li>
                </ul>
                <p style="color: #6b7280; font-size: 14px;">— The Agent Resources Team<br>
                    <a href="https://shopagentresources.com">shopagentresources.com</a>
                </p>
            </div>
        </body>
        </html>
        """
        resend.Emails.send({
            "from": "Agent Resources <info@shopagentresources.com>",
            "to": email,
            "subject": "Welcome to Agent Resources - Your Developer Code Inside!",
            "html": html_content,
            "reply_to": "Agent Resources <support@shopagentresources.com>"
        })
        print(f"[EMAIL] Welcome email sent to {email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {email}: {e}")

def send_waitlist_email(email: str):
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Would send waitlist email to {email}")
        return

    try:
        resend.api_key = settings.RESEND_API_KEY
        html_content = """
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">You're on the list!</h1>
                <p>Thanks for your interest in Agent Resources. We've filled all 50 early developer spots, but you're still on our waitlist.</p>
                <p>We'll notify you as soon as the marketplace is live so you can start selling your AI personas, skills, and MCP servers.</p>
                <p style="color: #6b7280; font-size: 14px;">— The Agent Resources Team<br>
                    <a href="https://shopagentresources.com">shopagentresources.com</a>
                </p>
            </div>
        </body>
        </html>
        """
        resend.Emails.send({
            "from": "Agent Resources <info@shopagentresources.com>",
            "to": email,
            "subject": "You're on the Agent Resources waitlist!",
            "html": html_content,
            "reply_to": "Agent Resources <support@shopagentresources.com>"
        })
        print(f"[EMAIL] Waitlist email sent to {email}")
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send email to {email}: {e}")

@router.post("/")
@router.post("")
def join_waitlist(request: WaitlistRequest):
    """Add email to waitlist"""
    session = next(get_session())
    try:
        existing = session.exec(select(WaitlistEntry).where(WaitlistEntry.email == request.email)).first()
        if existing:
            return {"status": "already_registered", "message": "You're already on the waitlist!"}

        current_count = session.exec(select(WaitlistEntry)).all()
        is_in_first_50 = len(current_count) < 50

        developer_code = generate_developer_code() if is_in_first_50 else None

        entry = WaitlistEntry(
            email=request.email,
            source=request.source,
            developer_code=developer_code
        )
        session.add(entry)
        session.commit()

        count = session.exec(select(WaitlistEntry)).all()
        total = len(count)
    finally:
        session.close()

    if is_in_first_50 and developer_code:
        send_welcome_email(request.email, developer_code)
    else:
        send_waitlist_email(request.email)

    if is_in_first_50:
        return {
            "status": "success",
            "message": "You've been added to the waitlist! Check your email for your developer code.",
            "developer_code": developer_code,
            "spots_remaining": max(0, 50 - total)
        }
    else:
        return {
            "status": "success",
            "message": "You've been added to the waitlist! We'll notify you when we're live.",
            "spots_remaining": 0
        }

@router.get("/count")
@router.get("/count/")
def get_waitlist_count():
    """Get total waitlist count"""
    session = next(get_session())
    try:
        entries = session.exec(select(WaitlistEntry)).all()
        count = len(entries)
    finally:
        session.close()
    return {"count": count, "spots_remaining": max(0, 50 - count)}

@router.post("/delete/")
def delete_from_waitlist(
    request: WaitlistRequest,
    x_setup_key: str = Header(..., alias="X-Setup-Key")
):
    """Delete email from waitlist — requires admin setup key"""
    if not settings.ADMIN_SETUP_KEY or x_setup_key != settings.ADMIN_SETUP_KEY:
        raise HTTPException(status_code=403, detail="Invalid setup key")

    session = next(get_session())
    try:
        entry = session.exec(select(WaitlistEntry).where(WaitlistEntry.email == request.email)).first()
        if entry:
            session.delete(entry)
            session.commit()
            return {"status": "success", "message": f"{request.email} removed from waitlist"}
        return {"status": "not_found", "message": "Email not found in waitlist"}
    finally:
        session.close()
