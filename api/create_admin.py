#!/usr/bin/env python3
"""
Create the default master admin user with properly hashed password.
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import select, Session, create_engine
from models import AdminUser
from passlib.context import CryptContext
from core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Default master admin credentials
MASTER_ADMIN_EMAIL = "berkaysurmeli@icloud.com"
MASTER_ADMIN_PASSWORD = "16384bEr32768!"
MASTER_ADMIN_NAME = "Master Admin"

def create_master_admin():
    """Create or update the master admin user"""
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as session:
        try:
            # Check if admin user already exists
            existing = session.exec(
                select(AdminUser).where(AdminUser.email == MASTER_ADMIN_EMAIL)
            ).first()
            
            # Hash the password
            password_hash = pwd_context.hash(MASTER_ADMIN_PASSWORD)
            
            if existing:
                # Update existing admin
                existing.password_hash = password_hash
                existing.name = MASTER_ADMIN_NAME
                existing.is_master_admin = True
                session.commit()
                print(f"[ADMIN] Updated master admin: {MASTER_ADMIN_EMAIL}")
            else:
                # Create new admin
                admin = AdminUser(
                    email=MASTER_ADMIN_EMAIL,
                    password_hash=password_hash,
                    name=MASTER_ADMIN_NAME,
                    is_master_admin=True
                )
                session.add(admin)
                session.commit()
                print(f"[ADMIN] Created master admin: {MASTER_ADMIN_EMAIL}")
            
            return True
            
        except Exception as e:
            session.rollback()
            print(f"[ADMIN ERROR] Failed to create admin: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    success = create_master_admin()
    sys.exit(0 if success else 1)
