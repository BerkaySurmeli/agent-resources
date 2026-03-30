from fastapi import APIRouter, HTTPException
from sqlmodel import text, select
from core.database import get_session
from models import User, Product
from passlib.context import CryptContext
import os
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin"])

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

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
                    session.rollback()
                    results.append({"file": migration_file, "status": "error", "error": str(e)})
            else:
                results.append({"file": migration_file, "status": "skipped"})
    
    return {"migrations": results}


@router.post("/fix-migrations")
async def fix_migrations():
    """Clear migration tracking and re-run only missing tables"""
    
    results = []
    
    for session in get_session():
        # Drop and recreate applied_migrations to start fresh
        session.execute(text("DROP TABLE IF EXISTS applied_migrations"))
        session.execute(text("""
            CREATE TABLE applied_migrations (
                filename VARCHAR(255) PRIMARY KEY,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Mark old migrations as applied (since tables exist)
        old_migrations = ['001_initial_schema.sql', '002_add_waitlist.sql', 
                         '003_add_auth_fields.sql', '004_add_email_verification.sql']
        for m in old_migrations:
            session.execute(
                text("INSERT INTO applied_migrations (filename) VALUES (:filename)"),
                {"filename": m}
            )
        
        session.commit()
        
        # Now run the listings migration
        try:
            migrations_dir = os.path.join(os.path.dirname(__file__), "..", "migrations")
            with open(os.path.join(migrations_dir, "005_add_listings.sql"), 'r') as f:
                sql = f.read()
            
            session.execute(text(sql))
            session.commit()
            
            session.execute(
                text("INSERT INTO applied_migrations (filename) VALUES ('005_add_listings.sql')")
            )
            session.commit()
            
            results.append({"file": "005_add_listings.sql", "status": "applied"})
        except Exception as e:
            session.rollback()
            results.append({"file": "005_add_listings.sql", "status": "error", "error": str(e)})

    return {"migrations": results}


@router.post("/seed-claudia")
async def seed_claudia():
    """Seed Claudia developer and the 3 persona products"""

    for session in get_session():
        try:
            # Check if Claudia already exists
            claudia = session.exec(select(User).where(User.email == "claudia@agentresources.com")).first()

            if not claudia:
                print("Creating Claudia developer user...")
                claudia = User(
                    id=uuid4(),
                    email="claudia@agentresources.com",
                    password_hash=pwd_context.hash("claudia123"),
                    name="Claudia",
                    avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Claudia&backgroundColor=b6e3f4",
                    is_developer=True,
                    is_verified=True,
                    created_at=datetime.utcnow()
                )
                session.add(claudia)
                session.commit()
                session.refresh(claudia)
            else:
                # Ensure she's marked as developer
                if not claudia.is_developer:
                    claudia.is_developer = True
                    session.commit()

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

            created_products = []
            for prod_data in products_data:
                existing = session.exec(select(Product).where(Product.slug == prod_data["slug"])).first()

                if not existing:
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
                    created_products.append(prod_data["name"])
                else:
                    # Ensure it's owned by Claudia
                    if existing.owner_id != claudia.id:
                        existing.owner_id = claudia.id
                        session.commit()

            return {
                "status": "success",
                "claudia_id": str(claudia.id),
                "claudia_email": claudia.email,
                "products_created": created_products,
                "message": "Seeding complete"
            }

        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Seed error: {str(e)}")
