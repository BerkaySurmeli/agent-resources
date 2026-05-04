#!/usr/bin/env python3
"""
Seed script to create Claudia developer user and assign products.
Run this after deployments to set up initial data.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import secrets
from sqlmodel import select
from core.database import get_session
from models import User, Product
from passlib.context import CryptContext
from uuid import uuid4
from datetime import datetime

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def seed_claudia_and_products():
    """Create Claudia developer and assign products"""
    
    # Get a database session
    session = next(get_session())
    
    try:
        # Check if Claudia already exists
        claudia = session.exec(select(User).where(User.email == "claudia@agentresources.com")).first()
        
        if not claudia:
            print("Creating Claudia developer user...")
            claudia = User(
                id=uuid4(),
                email="claudia@agentresources.com",
                password_hash=pwd_context.hash(secrets.token_hex(32)),
                name="Claudia",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Claudia&backgroundColor=b6e3f4",
                is_developer=True,
                is_verified=True,
                created_at=datetime.utcnow()
            )
            session.add(claudia)
            session.commit()
            session.refresh(claudia)
            print(f"✓ Created Claudia (ID: {claudia.id})")
        else:
            print(f"✓ Claudia already exists (ID: {claudia.id})")
            # Ensure she's marked as developer
            if not claudia.is_developer:
                claudia.is_developer = True
                session.commit()
                print("  Updated is_developer to True")
        
        # Define the 3 products
        products_data = [
            {
                "slug": "claudia-project-manager",
                "name": "AI Project Manager",
                "description": "Your AI project orchestrator. Delegates tasks, tracks progress, and ensures nothing falls through the cracks.",
                "category": "persona",
                "price_cents": 4900,
                "category_tags": ["project-management", "productivity", "team-leadership"]
            },
            {
                "slug": "chen-developer", 
                "name": "AI Developer",
                "description": "Your AI software engineer. Writes clean, efficient code across any stack.",
                "category": "persona",
                "price_cents": 5900,
                "category_tags": ["coding", "software-engineering", "full-stack"]
            },
            {
                "slug": "adrian-ux-designer",
                "name": "AI UX Designer", 
                "description": "Your AI design partner. Creates interfaces, writes copy, and crafts user experiences.",
                "category": "persona",
                "price_cents": 4900,
                "category_tags": ["design", "ux-ui", "creative"]
            }
        ]
        
        for prod_data in products_data:
            existing = session.exec(select(Product).where(Product.slug == prod_data["slug"])).first()
            
            if not existing:
                print(f"Creating product: {prod_data['name']}...")
                product = Product(
                    id=uuid4(),
                    owner_id=claudia.id,
                    name=prod_data["name"],
                    slug=prod_data["slug"],
                    description=prod_data["description"],
                    category=prod_data["category"],
                    category_tags=prod_data["category_tags"],
                    price_cents=prod_data["price_cents"],
                    is_active=True,
                    is_verified=True,
                    created_at=datetime.utcnow()
                )
                session.add(product)
                session.commit()
                print(f"  ✓ Created {prod_data['name']} (ID: {product.id})")
            else:
                print(f"  ✓ {prod_data['name']} already exists")
                # Ensure it's owned by Claudia
                if existing.owner_id != claudia.id:
                    existing.owner_id = claudia.id
                    session.commit()
                    print(f"    Updated owner to Claudia")
        
        print("\n✅ Seeding complete!")
        print(f"Claudia login: claudia@agentresources.com / claudia123")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    seed_claudia_and_products()
