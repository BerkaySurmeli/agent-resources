from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenClaw Marketplace"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/openclaw"
    DB_ECHO: bool = False
    SECRET_KEY: str = "SUPER_SECRET_CHANGE_ME_2026"  # TODO: Override in production
    STRIPE_SECRET_KEY: str = "sk_test_..."  # Add your Stripe secret key
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."  # Add your Stripe publishable key
    STRIPE_WEBHOOK_SECRET: str = ""  # Add your Stripe webhook secret
    
    # Resend Email API Configuration
    RESEND_API_KEY: str = ""
    FROM_EMAIL_INFO: str = "Agent Resources <info@shopagentresources.com>"
    FROM_EMAIL_SUPPORT: str = "Agent Resources <support@shopagentresources.com>"
    
    # Cloudflare Analytics
    CLOUDFLARE_API_TOKEN: str = ""
    CLOUDFLARE_ZONE_ID: str = ""
    
    class Config:
        env_file = ".env"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Strip whitespace from Stripe key to fix multiline issues
        self.STRIPE_SECRET_KEY = self.STRIPE_SECRET_KEY.strip().replace('\n', '').replace('\r', '')
        
        # Check if Resend is configured
        if self.RESEND_API_KEY:
            print("[EMAIL CONFIG] Using Resend API for email delivery")
        else:
            print("[EMAIL CONFIG] WARNING: Resend API key not configured - emails will not be sent")

settings = Settings()

# Debug: Log config on startup
print(f"[CONFIG] Starting with SECRET_KEY: {bool(settings.SECRET_KEY)} (len: {len(settings.SECRET_KEY)})")
print(f"[CONFIG] SECRET_KEY first 20 chars: {settings.SECRET_KEY[:20]}...")
print(f"[CONFIG] CLOUDFLARE_API_TOKEN: {bool(settings.CLOUDFLARE_API_TOKEN)}")
print(f"[CONFIG] CLOUDFLARE_ZONE_ID: {bool(settings.CLOUDFLARE_ZONE_ID)}")

# Check if .env file exists and log its contents
import os
if os.path.exists('.env'):
    print("[CONFIG] WARNING: .env file exists!")
    with open('.env', 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key = line.split('=')[0] if '=' in line else line
                print(f"[CONFIG] .env contains: {key}")
