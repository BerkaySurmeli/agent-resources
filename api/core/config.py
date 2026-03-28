from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenClaw Marketplace"
    DATABASE_URL: str = "postgresql://user:pass@localhost:5432/openclaw"
    DB_ECHO: bool = False
    SECRET_KEY: str = "SUPER_SECRET_CHANGE_ME_2026"  # TODO: Override in production
    
    class Config:
        env_file = ".env"

settings = Settings()
