#!/usr/bin/env python3
"""Migration script to add became_developer_at column to users table"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

def migrate():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column already exists
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'became_developer_at'
            """))
            if result.fetchone():
                print("Column 'became_developer_at' already exists in users table")
                return
        except Exception as e:
            print(f"Warning checking column existence: {e}")
        
        # Add the column
        try:
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN became_developer_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
            """))
            conn.commit()
            print("✅ Successfully added 'became_developer_at' column to users table")
        except ProgrammingError as e:
            if "already exists" in str(e):
                print("Column 'became_developer_at' already exists")
            else:
                raise
        except Exception as e:
            print(f"❌ Error adding column: {e}")
            raise

if __name__ == "__main__":
    migrate()
