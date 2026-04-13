"""Email service for sending purchase confirmations and notifications"""

import httpx
from core.config import settings

RESEND_API_KEY = settings.RESEND_API_KEY
FROM_EMAIL = settings.FROM_EMAIL_INFO

async def send_purchase_confirmation(to_email: str, buyer_name: str, item_name: str, download_url: str):
    """Send purchase confirmation email with download link"""
    if not RESEND_API_KEY:
        print(f"[EMAIL] Skipping purchase confirmation - no API key configured")
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": f"Agent Resources <{FROM_EMAIL}>",
                    "to": [to_email],
                    "subject": f"Your purchase: {item_name}",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1e293b;">Thank you for your purchase!</h2>
                        <p>Hi {buyer_name},</p>
                        <p>You've successfully purchased <strong>{item_name}</strong>.</p>
                        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Download Your Files</h3>
                            <a href="{download_url}" 
                               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; font-weight: 500;">
                                Download Now
                            </a>
                        </div>
                        <h3>Installation Instructions</h3>
                        <ol>
                            <li>Download the ZIP file</li>
                            <li>Extract to your OpenClaw skills folder: <code>~/.openclaw/skills/</code></li>
                            <li>Restart OpenClaw or run: <code>openclaw reload</code></li>
                        </ol>
                        <p>Need help? Reply to this email or contact support.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Agent Resources - The marketplace for AI agents<br>
                            <a href="https://shopagentresources.com">shopagentresources.com</a>
                        </p>
                    </div>
                    """
                }
            )
            
            if response.status_code == 200:
                print(f"[EMAIL] Purchase confirmation sent to {to_email}")
            else:
                print(f"[EMAIL] Failed to send email: {response.text}")
    except Exception as e:
        print(f"[EMAIL] Error sending purchase confirmation: {e}")

async def send_listing_approved_email(to_email: str, seller_name: str, listing_name: str, listing_url: str):
    """Send email when listing is approved"""
    if not RESEND_API_KEY:
        print(f"[EMAIL] Skipping listing approval email - no API key configured")
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": f"Agent Resources <{FROM_EMAIL}>",
                    "to": [to_email],
                    "subject": f"Your listing is now live: {listing_name}",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1e293b;">Your listing is approved!</h2>
                        <p>Hi {seller_name},</p>
                        <p>Great news! Your listing <strong>{listing_name}</strong> has passed security review and is now live on Agent Resources.</p>
                        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <a href="{listing_url}" 
                               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; font-weight: 500;">
                                View Your Listing
                            </a>
                        </div>
                        <p>Your listing is now available to thousands of OpenClaw users.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Agent Resources - The marketplace for AI agents<br>
                            <a href="https://shopagentresources.com">shopagentresources.com</a>
                        </p>
                    </div>
                    """
                }
            )
            
            if response.status_code == 200:
                print(f"[EMAIL] Listing approval email sent to {to_email}")
            else:
                print(f"[EMAIL] Failed to send email: {response.text}")
    except Exception as e:
        print(f"[EMAIL] Error sending listing approval email: {e}")

async def send_sale_notification(to_email: str, seller_name: str, item_name: str, amount: str, buyer_email: str):
    """Send email to seller when someone buys their item"""
    if not RESEND_API_KEY:
        print(f"[EMAIL] Skipping sale notification - no API key configured")
        return
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={
                    "from": f"Agent Resources <{FROM_EMAIL}>",
                    "to": [to_email],
                    "subject": f"You made a sale: {item_name}",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #1e293b;">You made a sale!</h2>
                        <p>Hi {seller_name},</p>
                        <p>Someone just purchased <strong>{item_name}</strong>.</p>
                        <div style="background: #dcfce7; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 24px; font-weight: bold; color: #166534;">{amount}</p>
                            <p style="margin: 5px 0 0 0; color: #166534; font-size: 14px;">Your earnings</p>
                        </div>
                        <p>Payouts are processed to your connected Stripe account within 2 business days.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        <p style="color: #64748b; font-size: 12px;">
                            Agent Resources - The marketplace for AI agents<br>
                            <a href="https://shopagentresources.com">shopagentresources.com</a>
                        </p>
                    </div>
                    """
                }
            )
            
            if response.status_code == 200:
                print(f"[EMAIL] Sale notification sent to {to_email}")
            else:
                print(f"[EMAIL] Failed to send email: {response.text}")
    except Exception as e:
        print(f"[EMAIL] Error sending sale notification: {e}")
