#!/usr/bin/env python3
"""
Migration script to add version and progress columns to listings table.
Run this to add the new columns without recreating the database.
"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel, Field, text
from core.database import engine

def migrate():
    """Add new columns to listings table"""
    from sqlalchemy import Column, String, Integer
    
    with engine.connect() as conn:
        # Add version column
        try:
            conn.execute(text("ALTER TABLE listings ADD COLUMN IF NOT EXISTS version VARCHAR(20) DEFAULT '1.0.0'"))
            print("✓ Added version column")
        except Exception as e:
            print(f"⚠ version column: {e}")
        
        # Add scan_progress column
        try:
            conn.execute(text("ALTER TABLE listings ADD COLUMN IF NOT EXISTS scan_progress INTEGER DEFAULT 0"))
            print("✓ Added scan_progress column")
        except Exception as e:
            print(f"⚠ scan_progress column: {e}")
        
        # Add translation_progress column
        try:
            conn.execute(text("ALTER TABLE listings ADD COLUMN IF NOT EXISTS translation_progress INTEGER DEFAULT 0"))
            print("✓ Added translation_progress column")
        except Exception as e:
            print(f"⚠ translation_progress column: {e}")
        
        conn.commit()
        print("\n✅ Migration complete!")

if __name__ == "__main__":
    migrate()
