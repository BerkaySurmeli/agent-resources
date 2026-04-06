#!/usr/bin/env python3
"""
Seed script to create all products including personas and MCP servers.
Run this after deployments to set up initial data.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import select
from core.database import get_session
from models import User, Product
from passlib.context import CryptContext
from uuid import uuid4
from datetime import datetime

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def seed_all_products():
    """Create all products including personas and MCP servers"""
    
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
            print(f"✓ Created Claudia (ID: {claudia.id})")
        else:
            print(f"✓ Claudia already exists (ID: {claudia.id})")
            if not claudia.is_developer:
                claudia.is_developer = True
                session.commit()
                print("  Updated is_developer to True")
        
        # Define all persona products
        persona_products = [
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
            },
            {
                "slug": "content-marketer",
                "name": "Content Marketer",
                "description": "Creates content, manages social media, writes copy.",
                "category": "persona",
                "price_cents": 3900,
                "category_tags": ["marketing", "content", "social-media"]
            },
            {
                "slug": "financial-analyst",
                "name": "Financial Analyst",
                "description": "Analyzes data, creates reports, provides insights.",
                "category": "persona",
                "price_cents": 4500,
                "category_tags": ["finance", "analytics", "reporting"]
            },
            {
                "slug": "hr-specialist",
                "name": "HR Specialist",
                "description": "Manages people ops, onboarding, documentation.",
                "category": "persona",
                "price_cents": 3500,
                "category_tags": ["hr", "people-ops", "documentation"]
            },
            {
                "slug": "operations-manager",
                "name": "Operations Manager",
                "description": "Streamlines processes, manages tools, optimizes workflows.",
                "category": "persona",
                "price_cents": 4200,
                "category_tags": ["operations", "process", "optimization"]
            }
        ]
        
        # Define all MCP server products
        mcp_products = [
            {
                "slug": "mcp-github",
                "name": "GitHub MCP Server",
                "description": "Create repos, manage issues, review PRs, and search code.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["development", "git", "version-control"]
            },
            {
                "slug": "mcp-slack",
                "name": "Slack MCP Server",
                "description": "Send messages, manage channels, and search conversations.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["communication", "messaging", "team"]
            },
            {
                "slug": "mcp-notion",
                "name": "Notion MCP Server",
                "description": "Create pages, manage databases, and search workspace.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["productivity", "documentation", "wiki"]
            },
            {
                "slug": "mcp-linear",
                "name": "Linear MCP Server",
                "description": "Create issues, manage projects, and track progress.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["project-management", "issues", "tracking"]
            },
            {
                "slug": "mcp-postgres",
                "name": "PostgreSQL MCP Server",
                "description": "Query databases, analyze data, and generate reports.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["database", "sql", "analytics"]
            },
            {
                "slug": "mcp-puppeteer",
                "name": "Puppeteer MCP Server",
                "description": "Web scraping, screenshots, and browser automation.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["automation", "browser", "scraping"]
            },
            {
                "slug": "mcp-filesystem",
                "name": "File System MCP Server",
                "description": "Read, write, and manage files with intelligent search.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["utilities", "files", "storage"]
            },
            {
                "slug": "mcp-fetch",
                "name": "Fetch MCP Server",
                "description": "Make HTTP requests and fetch data from any API.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["utilities", "api", "http"]
            },
            {
                "slug": "mcp-brave",
                "name": "Brave Search MCP Server",
                "description": "Web search with privacy-focused results.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["research", "search", "web"]
            },
            {
                "slug": "mcp-weather",
                "name": "Weather MCP Server",
                "description": "Get current weather and forecasts for any location.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["utilities", "weather", "data"]
            },
            {
                "slug": "mcp-calendar",
                "name": "Google Calendar MCP Server",
                "description": "Schedule meetings, check availability, manage events.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["productivity", "calendar", "scheduling"]
            },
            {
                "slug": "mcp-gmail",
                "name": "Gmail MCP Server",
                "description": "Send emails, search inbox, manage labels.",
                "category": "mcp_server",
                "price_cents": 99,
                "category_tags": ["communication", "email", "productivity"]
            }
        ]
        
        all_products = persona_products + mcp_products
        created_count = 0
        
        for prod_data in all_products:
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
                created_count += 1
                print(f"  ✓ Created {prod_data['name']} (ID: {product.id})")
            else:
                print(f"  ✓ {prod_data['name']} already exists")
                # Ensure it's owned by Claudia
                if existing.owner_id != claudia.id:
                    existing.owner_id = claudia.id
                    session.commit()
                    print(f"    Updated owner to Claudia")
        
        print(f"\n✅ Seeding complete!")
        print(f"Created {created_count} new products")
        print(f"Total products: {len(all_products)}")
        print(f"\nClaudia login: claudia@agentresources.com / claudia123")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    seed_all_products()
