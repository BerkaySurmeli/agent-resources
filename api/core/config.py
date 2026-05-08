from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agent Resources Marketplace"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/openclaw"
    DB_ECHO: bool = False
    SECRET_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_SUB_WEBHOOK_SECRET: str = ""   # separate webhook secret for subscription events
    STRIPE_PRO_PRICE_ID: str = ""          # Stripe Price ID for $19/mo Pro plan

    # Launch window: developers who sign up before this date get 6 months free of commission
    # Format: YYYY-MM-DD  (set to "" to disable)
    LAUNCH_CUTOFF_DATE: str = "2026-11-05"

    # Admin setup key — required to call privileged setup/seed endpoints
    ADMIN_SETUP_KEY: str = ""

    # Shared secret for cron-triggered endpoints (set to a long random string)
    CRON_SECRET: str = ""

    # Resend Email API Configuration
    RESEND_API_KEY: str = ""
    FROM_EMAIL_INFO: str = "Agent Resources <info@shopagentresources.com>"
    FROM_EMAIL_SUPPORT: str = "Agent Resources <support@shopagentresources.com>"

    # Cloudflare Analytics
    CLOUDFLARE_API_TOKEN: str = ""
    CLOUDFLARE_ZONE_ID: str = ""

    # Frontend origin — used to build return URLs for Stripe Connect
    FRONTEND_URL: str = "https://www.shopagentresources.com"

    # OAuth 2.1 — ES256 EC key pair for agent token signing
    # Generate: openssl ecparam -genkey -name prime256v1 -noout -out ec_private.pem
    #           openssl ec -in ec_private.pem -pubout -out ec_public.pem
    OAUTH_PRIVATE_KEY: str = ""
    OAUTH_PUBLIC_KEY: str = ""
    OAUTH_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.STRIPE_SECRET_KEY = self.STRIPE_SECRET_KEY.strip().replace('\n', '').replace('\r', '')

        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be set in environment")
        if not self.STRIPE_SECRET_KEY:
            raise ValueError("STRIPE_SECRET_KEY must be set in environment")

        if self.RESEND_API_KEY:
            print("[EMAIL CONFIG] Using Resend API for email delivery")
        else:
            print("[EMAIL CONFIG] WARNING: Resend API key not configured - emails will not be sent")

        if not self.ADMIN_SETUP_KEY:
            print("[CONFIG] WARNING: ADMIN_SETUP_KEY is not set — privileged setup endpoints are disabled")

        if not self.OAUTH_PRIVATE_KEY or not self.OAUTH_PUBLIC_KEY:
            print("[OAUTH CONFIG] WARNING: EC key pair not set — OAuth endpoints will return 503")

settings = Settings()
