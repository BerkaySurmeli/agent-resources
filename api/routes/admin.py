from fastapi import APIRouter, HTTPException
from sqlmodel import text
from core.database import get_session
import os

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/run-migrations")
async def run_migrations():
    """Run pending database migrations"""
    
    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "migrations")
    
    # Get list of migration files
    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
    
    results = []
    
    for session in get_session():
        # Create migrations tracking table if it doesn't exist
        session.execute(text("""
            CREATE TABLE IF NOT EXISTS applied_migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        session.commit()
        
        # Get already applied migrations
        result = session.execute(text("SELECT filename FROM applied_migrations"))
        applied = {row[0] for row in result}
        
        # Apply pending migrations
        for migration_file in migration_files:
            if migration_file not in applied:
                try:
                    with open(os.path.join(migrations_dir, migration_file), 'r') as f:
                        sql = f.read()
                    
                    # Execute migration
                    session.execute(text(sql))
                    session.commit()
                    
                    # Record migration
                    session.execute(
                        text("INSERT INTO applied_migrations (filename) VALUES (:filename)"),
                        {"filename": migration_file}
                    )
                    session.commit()
                    
                    results.append({"file": migration_file, "status": "applied"})
                except Exception as e:
                    results.append({"file": migration_file, "status": "error", "error": str(e)})
            else:
                results.append({"file": migration_file, "status": "skipped"})
    
    return {"migrations": results}
