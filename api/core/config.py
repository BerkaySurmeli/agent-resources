from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenClaw Marketplace"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/openclaw"
    DB_ECHO: bool = False
    SECRET_KEY: str = "SUPER_SECRET_CHANGE_ME_2026"  # TODO: Override in production
    STRIPE_SECRET_KEY: str = "sk_test_..."  # Add your Stripe secret key
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."  # Add your Stripe publishable key
    
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

# Debug: Log Cloudflare config on startup
print(f"[CONFIG DEBUG] CLOUDFLARE_API_TOKEN set: {bool(settings.CLOUDFLARE_API_TOKEN)}")
print(f"[CONFIG DEBUG] CLOUDFLARE_ZONE_ID set: {bool(settings.CLOUDFLARE_ZONE_ID)}")
print(f"[CONFIG DEBUG] CLOUDFLARE_ZONE_ID value: {settings.CLOUDFLARE_ZONE_ID}")
