#!/usr/bin/env python3
"""Run database migrations"""

import os
from sqlalchemy import create_engine, text
from core.config import settings

def migrate_became_developer_at():
    """Add became_developer_at column to users table if it doesn't exist"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'became_developer_at'
        """))
        
        if result.fetchone():
            print("Column 'became_developer_at' already exists in users table")
            return False
        
        # Add the column
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN became_developer_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
        """))
        conn.commit()
        print("✅ Successfully added 'became_developer_at' column to users table")
        return True

if __name__ == "__main__":
    migrate_became_developer_at()
