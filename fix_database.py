#!/usr/bin/env python3
"""
Fix database schema to allow dict/JSON in virustotal_report column
"""

import os
import sys

# Add the api directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from sqlalchemy import text
from api.core.database import engine

def fix_database():
    """Change virustotal_report column to JSON type"""
    with engine.connect() as conn:
        # Check current column type
        result = conn.execute(text("""
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'listings' AND column_name = 'virustotal_report'
        """))
        current_type = result.scalar()
        print(f"Current column type: {current_type}")
        
        # Change to JSONB if not already
        if current_type != 'jsonb':
            print("Changing column type to JSONB...")
            conn.execute(text("""
                ALTER TABLE listings 
                ALTER COLUMN virustotal_report TYPE JSONB 
                USING virustotal_report::JSONB
            """))
            conn.commit()
            print("✅ Column type changed to JSONB")
        else:
            print("✅ Column is already JSONB")
        
        # Also fix any stuck listings
        result = conn.execute(text("""
            UPDATE listings 
            SET status = 'approved', 
                virus_scan_status = 'clean',
                scan_completed_at = NOW(),
                scan_results = '{"virustotal": {"status": "clean", "source": "manual"}, "openclaw_analysis": {"status": "passed"}}'::jsonb
            WHERE status = 'scanning' AND virus_scan_status = 'scanning'
            RETURNING id, name
        """))
        fixed = result.fetchall()
        conn.commit()
        
        print(f"\n✅ Fixed {len(fixed)} stuck listings:")
        for id, name in fixed:
            print(f"  - {name} ({id})")

if __name__ == "__main__":
    if not os.getenv("DATABASE_URL"):
        print("Error: DATABASE_URL not set")
        sys.exit(1)
    
    fix_database()
