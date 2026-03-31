#!/usr/bin/env python3
"""
Run a specific migration file directly
Usage: python run_single_migration.py 009_add_listing_translation_fields.sql
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import create_engine, text
from core.config import settings

def run_single_migration(filename):
    engine = create_engine(settings.DATABASE_URL)
    migrations_dir = os.path.join(os.path.dirname(__file__), '..', 'migrations')
    filepath = os.path.join(migrations_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"Migration file not found: {filepath}")
        return False
    
    with engine.connect() as conn:
        # Create migrations tracking table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS _migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()
        
        # Check if already applied
        result = conn.execute(
            text("SELECT 1 FROM _migrations WHERE filename = :filename"),
            {"filename": filename}
        )
        if result.fetchone():
            print(f"Migration {filename} already applied")
            return True
        
        # Read and execute migration
        with open(filepath, 'r') as f:
            sql = f.read()
        
        conn.execute(text(sql))
        conn.execute(
            text("INSERT INTO _migrations (filename) VALUES (:filename)"),
            {"filename": filename}
        )
        conn.commit()
        print(f"Successfully applied migration: {filename}")
        return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_single_migration.py <filename>")
        sys.exit(1)
    
    filename = sys.argv[1]
    success = run_single_migration(filename)
    sys.exit(0 if success else 1)