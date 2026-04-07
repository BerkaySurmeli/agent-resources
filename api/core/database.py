from sqlmodel import Session, create_engine, text
from core.config import settings
import os

def get_session():
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        yield session

def run_migrations():
    """Run SQL migration files on startup"""
    engine = create_engine(settings.DATABASE_URL)
    migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'migrations')
    
    with engine.connect() as conn:
        # Create migrations tracking table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS _migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        # Get list of applied migrations
        result = conn.execute(text("SELECT filename FROM _migrations"))
        applied = {row[0] for row in result}
        
        # Find and run pending migrations
        if os.path.exists(migrations_dir):
            migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
            for filename in migration_files:
                if filename not in applied:
                    filepath = os.path.join(migrations_dir, filename)
                    with open(filepath, 'r') as f:
                        sql = f.read()
                    
                    # Execute migration
                    conn.execute(text(sql))
                    conn.execute(
                        text("INSERT INTO _migrations (filename) VALUES (:filename)"),
                        {"filename": filename}
                    )
                    conn.commit()
                    print(f"Applied migration: {filename}")
