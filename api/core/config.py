from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenClaw Marketplace"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/openclaw"
    DB_ECHO: bool = False
    SECRET_KEY: str = "SUPER_SECRET_CHANGE_ME_2026"  # TODO: Override in production
    STRIPE_SECRET_KEY: str = "sk_test_..."  # Add your Stripe secret key
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."  # Add your Stripe publishable key
    
    # Email configuration - supports multiple Zoho accounts
    ZOHO_SMTP_SERVER: str = "smtp.zoho.com"
    ZOHO_SMTP_PORT: int = 587
    
    # Primary sender email (for verification, notifications)
    ZOHO_EMAIL: str = "info@shopagentresources.com"
    ZOHO_PASSWORD: str = ""
    
    # Support email (for contact form - can be same or different account)
    ZOHO_SUPPORT_EMAIL: str = "support@shopagentresources.com"
    ZOHO_SUPPORT_PASSWORD: str = ""  # Only needed if different from ZOHO_PASSWORD
    
    class Config:
        env_file = ".env"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Strip whitespace from Stripe key to fix multiline issues
        self.STRIPE_SECRET_KEY = self.STRIPE_SECRET_KEY.strip().replace('\n', '').replace('\r', '')
        
        # If support password not set, use main password
        if not self.ZOHO_SUPPORT_PASSWORD:
            self.ZOHO_SUPPORT_PASSWORD = self.ZOHO_PASSWORD

settings = Settings()
