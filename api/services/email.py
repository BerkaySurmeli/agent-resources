"""Email service using Resend API"""
import resend
from core.config import settings

# Initialize Resend with API key
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY


class EmailService:
    """Service for sending emails via Resend API"""
    
    @staticmethod
    def send_verification_email(to_email: str, name: str, token: str) -> dict:
        """Send email verification email to user"""
        if not settings.RESEND_API_KEY:
            print("[EMAIL ERROR] Resend API key not configured")
            raise Exception("Email service not configured. Please contact support.")
        
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
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: #2563eb; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-weight: bold; font-size: 24px;">AR</span>
        </div>
        <h1 style="color: #0f172a; margin: 0;">Welcome to Agent Resources</h1>
    </div>

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
                "from": f"Agent Resources <{settings.FROM_EMAIL_INFO}>",
                "to": [to_email],
                "subject": "Welcome to Agent Resources - Verify Your Email",
                "html": html_content,
                "text": text_content
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
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: #2563eb; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
            <span style="color: white; font-weight: bold; font-size: 24px;">AR</span>
        </div>
        <h1 style="color: #0f172a; margin: 0;">Reset Your Password</h1>
    </div>

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
                "from": f"Agent Resources <{settings.FROM_EMAIL_INFO}>",
                "to": [to_email],
                "subject": "Password Reset Request - Agent Resources",
                "html": html_content,
                "text": text_content
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


# Convenience function for backward compatibility
def send_verification_email(to_email: str, name: str, token: str) -> dict:
    """Send verification email via Resend API"""
    return EmailService.send_verification_email(to_email, name, token)
