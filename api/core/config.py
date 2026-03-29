from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenClaw Marketplace"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/openclaw"
    DB_ECHO: bool = False
    SECRET_KEY: str = "SUPER_SECRET_CHANGE_ME_2026"  # TODO: Override in production
    STRIPE_SECRET_KEY: str = "sk_test_..."  # Add your Stripe secret key
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."  # Add your Stripe publishable key
    
    class Config:
        env_file = ".env"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Strip whitespace from Stripe key to fix multiline issues
        self.STRIPE_SECRET_KEY = self.STRIPE_SECRET_KEY.strip().replace('\n', '').replace('\r', '')

settings = Settings()
