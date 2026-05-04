from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agent Resources Marketplace"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/openclaw"
    DB_ECHO: bool = False
    SECRET_KEY: str = "SUPER_SECRET_CHANGE_ME_2026"
    STRIPE_SECRET_KEY: str = "sk_test_..."
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."
    STRIPE_WEBHOOK_SECRET: str = ""

    # Admin setup key — required to call privileged setup/seed endpoints
    ADMIN_SETUP_KEY: str = ""

    # Resend Email API Configuration
    RESEND_API_KEY: str = ""
    FROM_EMAIL_INFO: str = "Agent Resources <info@shopagentresources.com>"
    FROM_EMAIL_SUPPORT: str = "Agent Resources <support@shopagentresources.com>"

    # Cloudflare Analytics
    CLOUDFLARE_API_TOKEN: str = ""
    CLOUDFLARE_ZONE_ID: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.STRIPE_SECRET_KEY = self.STRIPE_SECRET_KEY.strip().replace('\n', '').replace('\r', '')

        if self.RESEND_API_KEY:
            print("[EMAIL CONFIG] Using Resend API for email delivery")
        else:
            print("[EMAIL CONFIG] WARNING: Resend API key not configured - emails will not be sent")

        if not self.ADMIN_SETUP_KEY:
            print("[CONFIG] WARNING: ADMIN_SETUP_KEY is not set — privileged setup endpoints are disabled")

settings = Settings()
