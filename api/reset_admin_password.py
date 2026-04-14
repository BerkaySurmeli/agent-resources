#!/usr/bin/env python3
"""Reset admin password - run this on the server"""
import os
import sys

# Add the api directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import create_engine, Session, select
from models import AdminUser
from core.security import hash_password
from core.config import settings

def reset_admin_password(email: str, new_password: str):
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as session:
        # Find admin
        admin = session.exec(select(AdminUser).where(AdminUser.email == email)).first()
        
        if not admin:
            print(f"Admin with email {email} not found")
            return False
        
        # Reset password
        admin.password_hash = hash_password(new_password)
        session.commit()
        
        print(f"Password reset successful for {email}")
        return True

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python reset_admin_password.py <email> <new_password>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    reset_admin_password(email, password)
