"""
Database migration script - run this to apply pending migrations
"""
import os
import sys
from sqlmodel import create_engine, text
from core.config import settings

def run_migrations():
    engine = create_engine(settings.DATABASE_URL)
    
    migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
    
    # Get list of migration files
    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
    
    with engine.connect() as conn:
        # Create migrations tracking table if it doesn't exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS applied_migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        # Get already applied migrations
        result = conn.execute(text("SELECT filename FROM applied_migrations"))
        applied = {row[0] for row in result}
        
        # Apply pending migrations
        for migration_file in migration_files:
            if migration_file not in applied:
                print(f"Applying migration: {migration_file}")
                
                with open(os.path.join(migrations_dir, migration_file), 'r') as f:
                    sql = f.read()
                
                # Execute migration
                conn.execute(text(sql))
                conn.commit()
                
                # Record migration
                conn.execute(
                    text("INSERT INTO applied_migrations (filename) VALUES (:filename)"),
                    {"filename": migration_file}
                )
                conn.commit()
                
                print(f"✓ Applied {migration_file}")
            else:
                print(f"Skipping {migration_file} (already applied)")
    
    print("\nMigrations complete!")

if __name__ == "__main__":
    run_migrations()
