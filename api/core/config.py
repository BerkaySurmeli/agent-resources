from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenClaw Marketplace"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/openclaw"
    DB_ECHO: bool = False
    SECRET_KEY: str = "SUPER_SECRET_CHANGE_ME_2026"  # TODO: Override in production
    STRIPE_SECRET_KEY: str = "sk_test_..."  # Add your Stripe secret key
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."  # Add your Stripe publishable key
    
    # Email configuration - supports Railway Email or Zoho
    # Railway Email (vergissberlin/railwayapp-email)
    EMAIL_HOST: str = ""
    EMAIL_CLIENT_USER: str = ""
    EMAIL_CLIENT_PASSWORD: str = ""
    EMAIL_CLIENT_FROM: str = ""
    EMAIL_SERVICE_PROVIDER: str = ""
    
    # Legacy Railway Email variables (for backwards compatibility)
    RAILWAY_EMAIL_SMTP_SERVER: str = ""
    RAILWAY_EMAIL_SMTP_PORT: int = 587
    RAILWAY_EMAIL_USER: str = ""
    RAILWAY_EMAIL_PASSWORD: str = ""
    RAILWAY_EMAIL_FROM: str = ""
    
    # Fallback: Zoho SMTP (may be blocked by Railway)
    ZOHO_SMTP_SERVER: str = "smtp.zoho.com"
    ZOHO_SMTP_PORT: int = 587
    ZOHO_EMAIL: str = "info@shopagentresources.com"
    ZOHO_PASSWORD: str = ""
    ZOHO_SUPPORT_EMAIL: str = "support@shopagentresources.com"
    ZOHO_SUPPORT_PASSWORD: str = ""
    
    class Config:
        env_file = ".env"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Strip whitespace from Stripe key to fix multiline issues
        self.STRIPE_SECRET_KEY = self.STRIPE_SECRET_KEY.strip().replace('\n', '').replace('\r', '')
        
        # If support password not set, use main password
        if not self.ZOHO_SUPPORT_PASSWORD:
            self.ZOHO_SUPPORT_PASSWORD = self.ZOHO_PASSWORD
        
        # Check which email service is configured
        if self.EMAIL_HOST and self.EMAIL_CLIENT_PASSWORD:
            print(f"[EMAIL CONFIG] Using Railway Email service ({self.EMAIL_SERVICE_PROVIDER})")
        elif self.RAILWAY_EMAIL_SMTP_SERVER and self.RAILWAY_EMAIL_PASSWORD:
            print("[EMAIL CONFIG] Using Railway Email service (legacy)")
        else:
            print("[EMAIL CONFIG] Using Zoho SMTP (may be blocked)")

settings = Settings()
