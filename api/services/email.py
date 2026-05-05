"""Email service using Resend API"""
import resend
from html import escape
from core.config import settings

# Initialize Resend with API key
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

# Consistent logo HTML for all emails - matches website bevelled gradient design
EMAIL_LOGO_HTML = """
<div style="text-align: center; margin-bottom: 30px;">
    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
        <span style="color: white; font-weight: 700; font-size: 24px; letter-spacing: -1px;">AR</span>
    </div>
    <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 700;">Agent Resources</h1>
</div>
""".strip()


class EmailService:
    """Service for sending emails via Resend API"""
    
    @staticmethod
    def send_verification_email(to_email: str, name: str, token: str) -> dict:
        """Send email verification email to user"""
        if not settings.RESEND_API_KEY:
            print("[EMAIL ERROR] Resend API key not configured")
            raise Exception("Email service not configured. Please contact support.")

        name = escape(name)
        verification_url = f"https://shopagentresources.com/verify-email?token={token}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    {EMAIL_LOGO_HTML}

    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <p style="margin-top: 0;">Hi {name},</p>
        <p>Welcome to Agent Resources! Please verify your email address to start buying and selling AI agents.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                Verify Email Address
            </a>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
    </div>

    <div style="text-align: center; font-size: 14px; color: #64748b;">
        <p>Best regards,<br>The Agent Resources Team</p>
        <p style="margin-top: 20px;">
            <a href="https://shopagentresources.com" style="color: #2563eb;">shopagentresources.com</a>
        </p>
    </div>
</body>
</html>
"""
        
        text_content = f"""
Hi {name},

Welcome to Agent Resources! Please verify your email address to start buying and selling AI agents.

Click the link below to verify your email:
{verification_url}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best regards,
The Agent Resources Team
"""
        
        try:
            response = resend.Emails.send({
                "from": settings.FROM_EMAIL_INFO,
                "to": [to_email],
                "subject": "Welcome to Agent Resources - Verify Your Email",
                "html": html_content,
                "text": text_content,
                "reply_to": settings.FROM_EMAIL_SUPPORT
            })
            print(f"[EMAIL] Verification email sent to {to_email}")
            return response
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send verification email: {e}")
            raise
    
    @staticmethod
    def send_password_reset_email(to_email: str, name: str, token: str) -> dict:
        """Send password reset email to user"""
        if not settings.RESEND_API_KEY:
            print("[EMAIL ERROR] Resend API key not configured")
            raise Exception("Email service not configured. Please contact support.")

        name = escape(name)
        reset_url = f"https://shopagentresources.com/reset-password?token={token}"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    {EMAIL_LOGO_HTML}

    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <p style="margin-top: 0;">Hi {name},</p>
        <p>We received a request to reset your password for your Agent Resources account.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                Reset Password
            </a>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
    </div>

    <div style="text-align: center; font-size: 14px; color: #64748b;">
        <p>Best regards,<br>The Agent Resources Team</p>
        <p style="margin-top: 20px;">
            <a href="https://shopagentresources.com" style="color: #2563eb;">shopagentresources.com</a>
        </p>
    </div>
</body>
</html>
"""
        
        text_content = f"""
Hi {name},

We received a request to reset your password for your Agent Resources account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.

Best regards,
The Agent Resources Team
"""
        
        try:
            response = resend.Emails.send({
                "from": settings.FROM_EMAIL_INFO,
                "to": [to_email],
                "subject": "Password Reset Request - Agent Resources",
                "html": html_content,
                "text": text_content,
                "reply_to": settings.FROM_EMAIL_SUPPORT
            })
            print(f"[EMAIL] Password reset email sent to {to_email}")
            return response
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send password reset email: {e}")
            raise
    
    @staticmethod
    def send_contact_form(name: str, from_email: str, category: str, subject: str, message: str) -> dict:
        """Send contact form submission to support team"""
        if not settings.RESEND_API_KEY:
            print("[EMAIL ERROR] Resend API key not configured")
            raise Exception("Email service not configured.")

        name = escape(name)
        category = escape(category)
        subject = escape(subject)
        message = escape(message)

        html_content = f"""<!DOCTYPE html>
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
                <td style="padding: 8px 0; font-weight: 500;">{category}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #64748b;">From:</td>
                <td style="padding: 8px 0; font-weight: 500;">{name} &lt;{from_email}&gt;</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #64748b;">Subject:</td>
                <td style="padding: 8px 0; font-weight: 500;">{subject}</td>
            </tr>
        </table>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <h3 style="color: #0f172a; margin-top: 0;">Message:</h3>
        <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; white-space: pre-wrap;">{message}</div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        
        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            This email was sent via the Agent Resources contact form.<br>
            Reply directly to this email to respond to {name}.
        </p>
    </div>
</body>
</html>"""
        
        text_content = f"""New Contact Form Submission

Category: {category}
From: {name} <{from_email}>
Subject: {subject}

Message:
{message}

---
This email was sent via the Agent Resources contact form.
"""
        
        try:
            response = resend.Emails.send({
                "from": f"Agent Resources Contact Form <{settings.FROM_EMAIL_SUPPORT}>",
                "to": [settings.FROM_EMAIL_SUPPORT],
                "reply_to": from_email,
                "subject": f"[{category}] {subject}",
                "html": html_content,
                "text": text_content
            })
            print(f"[EMAIL] Contact form email sent to support from {from_email}")
            return response
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send contact form email: {e}")
            raise


    @staticmethod
    def send_developer_welcome_email(to_email: str, name: str, developer_code: str) -> dict:
        """Send welcome email to new developers with their developer code"""
        name = escape(name)
        developer_code = escape(developer_code)
        if not settings.RESEND_API_KEY:
            print("[EMAIL ERROR] Resend API key not configured")
            raise Exception("Email service not configured. Please contact support.")
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Agent Resources - Your Developer Code Inside!</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    {EMAIL_LOGO_HTML}

    <h2 style="color: #2563eb; text-align: center;">Welcome to Agent Resources!</h2>
    
    <p style="text-align: center; color: #64748b;">Your spot is secured. We'll notify you when the marketplace is ready.</p>

    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin: 30px 0;">
        <h3 style="color: #0f172a; margin-top: 0;">Your Developer Code</h3>
        <div style="background: white; border-radius: 8px; padding: 20px; text-align: center; border: 2px solid #2563eb;">
            <code style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px;">{developer_code}</code>
        </div>
        <p style="margin-bottom: 0; font-size: 14px; color: #64748b;">Use this code when creating your first listing to get $20 after your first sale!</p>
    </div>

    <div style="background: #eff6ff; border-radius: 12px; padding: 24px; margin: 30px 0;">
        <p style="margin-top: 0; color: #0f172a; font-weight: 500;">As one of our first 50 developers, you're eligible for:</p>
        <ul style="margin-bottom: 0; padding-left: 20px; color: #334155;">
            <li style="margin-bottom: 8px;">✓ List your first item free</li>
            <li>✓ $20 bonus after your first sale</li>
        </ul>
    </div>

    <p style="color: #64748b;">Stay tuned for updates!</p>

    <div style="text-align: center; font-size: 14px; color: #64748b; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p>— The Agent Resources Team</p>
        <p style="margin-top: 20px;">
            <a href="https://shopagentresources.com" style="color: #2563eb;">shopagentresources.com</a>
        </p>
    </div>
</body>
</html>
"""
        
        text_content = f"""
Welcome to Agent Resources!

Your spot is secured. We'll notify you when the marketplace is ready.

Your Developer Code
{developer_code}

Use this code when creating your first listing to get $20 after your first sale!

As one of our first 50 developers, you're eligible for:
✓ List your first item free
✓ $20 bonus after your first sale

Stay tuned for updates!

— The Agent Resources Team
shopagentresources.com
"""
        
        try:
            response = resend.Emails.send({
                "from": settings.FROM_EMAIL_INFO,
                "to": [to_email],
                "subject": "Welcome to Agent Resources - Your Developer Code Inside!",
                "html": html_content,
                "text": text_content,
                "reply_to": settings.FROM_EMAIL_SUPPORT
            })
            print(f"[EMAIL] Developer welcome email sent to {to_email}")
            return response
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send developer welcome email: {e}")
            raise


# Convenience function for backward compatibility
def send_verification_email(to_email: str, name: str, token: str) -> dict:
    """Send verification email via Resend API"""
    return EmailService.send_verification_email(to_email, name, token)


def send_developer_welcome_email(to_email: str, name: str, developer_code: str) -> dict:
    """Send developer welcome email with code"""
    return EmailService.send_developer_welcome_email(to_email, name, developer_code)


def send_purchase_confirmation(to_email: str, product_name: str, amount: float) -> dict:
    """Send purchase confirmation email to buyer"""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Purchase confirmation (dry run): {to_email} bought {product_name} for ${amount}")
        return {"id": "dry-run"}

    product_name = escape(product_name)

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Your Purchase!</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    {EMAIL_LOGO_HTML}

    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <p style="margin-top: 0;">Hi there,</p>
        <p>Thank you for purchasing <strong>{product_name}</strong>!</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Item:</span>
                <span style="font-weight: 500;">{product_name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                <span style="color: #64748b;">Total:</span>
                <span style="font-weight: bold; color: #2563eb;">${amount:.2f}</span>
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="https://shopagentresources.com/settings?tab=purchases" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                View Your Purchases
            </a>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            You can download your purchase from your account dashboard. If you have any questions, reply to this email.
        </p>
    </div>

    <div style="text-align: center; font-size: 14px; color: #64748b;">
        <p>Best regards,<br>The Agent Resources Team</p>
        <p style="margin-top: 20px;">
            <a href="https://shopagentresources.com" style="color: #2563eb;">shopagentresources.com</a>
        </p>
    </div>
</body>
</html>
"""
    
    text_content = f"""
Thank You for Your Purchase!

Hi there,

Thank you for purchasing {product_name}!

Order Details:
- Item: {product_name}
- Total: ${amount:.2f}

You can download your purchase from your account dashboard at:
https://shopagentresources.com/settings?tab=purchases

If you have any questions, reply to this email.

Best regards,
The Agent Resources Team
"""
    
    try:
        response = resend.Emails.send({
            "from": settings.FROM_EMAIL_INFO,
            "to": [to_email],
            "subject": f"Your Purchase: {product_name}",
            "html": html_content,
            "text": text_content,
            "reply_to": settings.FROM_EMAIL_SUPPORT
        })
        print(f"[EMAIL] Purchase confirmation sent to {to_email}")
        return response
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send purchase confirmation: {e}")
        return {"error": str(e)}


def send_listing_submission_notification(listing_name: str, developer_name: str, developer_email: str, virus_scan_status: str, preview_url: str, listing_id: str) -> dict:
    """Send notification to admin when a new listing is submitted for review"""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Listing submission notification (dry run): {listing_name} by {developer_name}")
        return {"id": "dry-run"}

    listing_name = escape(listing_name)
    developer_name = escape(developer_name)

    status_color = "#22c55e" if virus_scan_status == "clean" else "#eab308" if virus_scan_status == "scanning" else "#64748b"
    status_text = "Clean" if virus_scan_status == "clean" else "Scanning" if virus_scan_status == "scanning" else "Pending"
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Listing Submission - Review Required</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: #f59e0b; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-weight: bold; font-size: 24px;">!</span>
        </div>
        <h1 style="color: #0f172a; margin: 0;">New Listing Submission</h1>
        <p style="color: #64748b; margin-top: 8px;">Review and approval required</p>
    </div>

    <div style="background: #fffbeb; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #fcd34d;">
        <h3 style="margin-top: 0; color: #0f172a;">{listing_name}</h3>
        
        <table style="width: 100%; margin: 20px 0;">
            <tr>
                <td style="padding: 8px 0; color: #64748b; width: 120px;">Developer:</td>
                <td style="padding: 8px 0; font-weight: 500;">{developer_name} ({developer_email})</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #64748b;">Virus Scan:</td>
                <td style="padding: 8px 0;">
                    <span style="color: {status_color}; font-weight: 500;">{status_text}</span>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: #64748b;">Listing ID:</td>
                <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">{listing_id}</td>
            </tr>
        </table>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{preview_url}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-right: 10px;">
                Preview Listing
            </a>
        </div>

        <div style="background: white; border-radius: 8px; padding: 16px; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">
                <strong>Admin Actions:</strong><br>
                Visit the admin dashboard to approve or reject this listing.
            </p>
        </div>
    </div>

    <div style="text-align: center; font-size: 14px; color: #64748b;">
        <p>This is an automated notification from Agent Resources.</p>
    </div>
</body>
</html>
"""
    
    text_content = f"""
New Listing Submission - Review Required

Listing: {listing_name}
Developer: {developer_name} ({developer_email})
Virus Scan Status: {status_text}
Listing ID: {listing_id}

Preview: {preview_url}

Visit the admin dashboard to approve or reject this listing.

---
This is an automated notification from Agent Resources.
"""
    
    try:
        response = resend.Emails.send({
            "from": settings.FROM_EMAIL_INFO,
            "to": [settings.FROM_EMAIL_SUPPORT],
            "subject": f"🔍 Review Required: {listing_name}",
            "html": html_content,
            "text": text_content,
            "reply_to": developer_email
        })
        print(f"[EMAIL] Listing submission notification sent for {listing_name}")
        return response
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send listing submission notification: {e}")
        return {"error": str(e)}


def send_sale_notification(to_email: str, product_name: str, earnings: float) -> dict:
    """Send sale notification email to seller"""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Sale notification (dry run): {to_email} sold {product_name} for ${earnings}")
        return {"id": "dry-run"}

    product_name = escape(product_name)

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You Made a Sale!</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: #22c55e; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-weight: bold; font-size: 24px;">$</span>
        </div>
        <h1 style="color: #0f172a; margin: 0;">You Made a Sale!</h1>
    </div>

    <div style="background: #f0fdf4; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
        <p style="margin-top: 0;">Great news! Someone just purchased your item:</p>
        
        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #0f172a;">{product_name}</h3>
            <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <span style="color: #64748b;">Your Earnings:</span>
                <span style="font-weight: bold; color: #22c55e; font-size: 20px;">${earnings:.2f}</span>
            </div>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            Your earnings will be included in your next weekly payout. Keep up the great work!
        </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="https://shopagentresources.com/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            View Dashboard
        </a>
    </div>

    <div style="text-align: center; font-size: 14px; color: #64748b;">
        <p>Best regards,<br>The Agent Resources Team</p>
        <p style="margin-top: 20px;">
            <a href="https://shopagentresources.com" style="color: #2563eb;">shopagentresources.com</a>
        </p>
    </div>
</body>
</html>
"""
    
    text_content = f"""
You Made a Sale!

Great news! Someone just purchased your item:

{product_name}

Your Earnings: ${earnings:.2f}

Your earnings will be included in your next weekly payout. Keep up the great work!

View your dashboard: https://shopagentresources.com/dashboard

Best regards,
The Agent Resources Team
"""
    
    try:
        response = resend.Emails.send({
            "from": settings.FROM_EMAIL_INFO,
            "to": [to_email],
            "subject": f"🎉 You Made a Sale: {product_name}",
            "html": html_content,
            "text": text_content,
            "reply_to": settings.FROM_EMAIL_SUPPORT
        })
        print(f"[EMAIL] Sale notification sent to {to_email}")
        return response
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send sale notification: {e}")
        return {"error": str(e)}


def send_bonus_notification(to_email: str, developer_name: str, listing_name: str, bonus_amount: float) -> dict:
    """Notify a developer they earned a referral bonus on their first sale"""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Bonus notification (dry run): {to_email} earned ${bonus_amount:.2f} bonus for {listing_name}")
        return {"id": "dry-run"}

    safe_name = escape(developer_name)
    safe_listing = escape(listing_name)

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    {EMAIL_LOGO_HTML}

    <div style="background: #fefce8; border-radius: 12px; padding: 30px; margin-bottom: 20px; border: 1px solid #fde68a;">
        <h2 style="margin-top: 0; color: #0f172a;">You earned a $20 bonus! 🎉</h2>
        <p>Hi {safe_name},</p>
        <p>Your listing <strong>{safe_listing}</strong> just made its first sale — and because you submitted it with a developer code, you've earned a <strong>${bonus_amount:.2f} bonus</strong>.</p>

        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <span style="font-size: 36px; font-weight: bold; color: #16a34a;">${bonus_amount:.2f}</span>
            <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">Bonus payout</p>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            This will be included in your next weekly payout alongside your regular earnings.
        </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
        <a href="https://shopagentresources.com/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            View Dashboard
        </a>
    </div>

    <div style="text-align: center; font-size: 14px; color: #64748b;">
        <p>Best regards,<br>The Agent Resources Team</p>
        <p><a href="https://shopagentresources.com" style="color: #2563eb;">shopagentresources.com</a></p>
    </div>
</body>
</html>
"""

    text_content = f"""
You earned a $20 bonus!

Hi {developer_name},

Your listing "{listing_name}" just made its first sale — and because you submitted it with a developer code, you've earned a ${bonus_amount:.2f} bonus.

This will be included in your next weekly payout alongside your regular earnings.

View your dashboard: https://shopagentresources.com/dashboard

Best regards,
The Agent Resources Team
"""

    try:
        response = resend.Emails.send({
            "from": settings.FROM_EMAIL_INFO,
            "to": [to_email],
            "subject": f"🎉 You earned a ${bonus_amount:.2f} bonus on {listing_name}!",
            "html": html_content,
            "text": text_content,
            "reply_to": settings.FROM_EMAIL_SUPPORT
        })
        print(f"[EMAIL] Bonus notification sent to {to_email}")
        return response
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send bonus notification: {e}")
        return {"error": str(e)}


def send_waitlist_invite_email(to_email: str, invite_code: str) -> dict:
    """Send waitlist invite email with unique signup link"""
    if not settings.RESEND_API_KEY:
        print(f"[EMAIL] Waitlist invite (dry run): {to_email} code={invite_code}")
        return {"id": "dry-run"}

    signup_url = f"https://shopagentresources.com/signup?invite={invite_code}"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're invited to Agent Resources</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    {EMAIL_LOGO_HTML}

    <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <p style="margin-top: 0;">You're on the list — and your invite is ready.</p>
        <p>Agent Resources is a marketplace for AI agent components: personas, skills, and MCP servers. You can publish your work and earn from every sale.</p>
        <p>Use the button below to claim your spot. Your invite link is unique to you and expires after use.</p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{signup_url}"
               style="display: inline-block; background: linear-gradient(135deg, #3549D4, #6470FA); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Create your account →
            </a>
        </div>

        <p style="color: #64748b; font-size: 14px;">Or copy this link into your browser:<br>
           <a href="{signup_url}" style="color: #3549D4;">{signup_url}</a>
        </p>
    </div>

    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px; font-weight: 600; color: #1e40af;">Early-access bonus</p>
        <p style="margin: 0; font-size: 14px; color: #1d4ed8;">Sign up now and keep 100% of every sale for 6 months — no platform commission while you build your catalogue.</p>
    </div>

    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
        Agent Resources · <a href="https://shopagentresources.com" style="color: #94a3b8;">shopagentresources.com</a>
    </p>
</body>
</html>"""

    text_content = f"""You're invited to Agent Resources

Your invite link: {signup_url}

Agent Resources is a marketplace for AI agent components — personas, skills, and MCP servers. Sign up now to publish your work and start earning.

Early-access bonus: keep 100% of every sale for 6 months, no platform commission.

Best regards,
The Agent Resources Team
"""

    try:
        response = resend.Emails.send({
            "from": settings.FROM_EMAIL_INFO,
            "to": [to_email],
            "subject": "Your Agent Resources invite is ready",
            "html": html_content,
            "text": text_content,
            "reply_to": settings.FROM_EMAIL_SUPPORT,
        })
        print(f"[EMAIL] Waitlist invite sent to {to_email}")
        return response
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send waitlist invite: {e}")
        return {"error": str(e)}
