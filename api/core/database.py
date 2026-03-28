from sqlmodel import Session, create_engine
from core.config import settings

def get_session():
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        yield session
