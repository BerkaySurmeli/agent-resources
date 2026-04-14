#!/usr/bin/env python3
"""
Seed MCP server listings for the marketplace.
Run this script to create initial MCP server listings.
"""

import os
import sys
import uuid
from datetime import datetime

# Add the api directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import select
from core.database import get_session
from models import Listing, User, Product

# MCP Server data
MCP_SERVERS = [
    {
        "name": "GitHub MCP Server",
        "slug": "mcp-github",
        "description": "Create repos, manage issues, review PRs, and search code. Full GitHub integration for your AI agents.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["development", "github", "version-control"],
    },
    {
        "name": "Slack MCP Server",
        "slug": "mcp-slack",
        "description": "Send messages, manage channels, and search conversations. Keep your team in the loop.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["communication", "slack", "messaging"],
    },
    {
        "name": "Notion MCP Server",
        "slug": "mcp-notion",
        "description": "Create pages, manage databases, and search your workspace. Perfect for documentation and knowledge management.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["productivity", "notion", "documentation"],
    },
    {
        "name": "Linear MCP Server",
        "slug": "mcp-linear",
        "description": "Create issues, manage projects, and track progress. Streamline your project management workflow.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["project-management", "linear", "issues"],
    },
    {
        "name": "PostgreSQL MCP Server",
        "slug": "mcp-postgres",
        "description": "Query databases, analyze data, and generate reports. Connect your agents to your data.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["database", "postgresql", "sql"],
    },
    {
        "name": "Puppeteer MCP Server",
        "slug": "mcp-puppeteer",
        "description": "Web scraping, screenshots, and browser automation. Extract data from any website.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["automation", "web-scraping", "browser"],
    },
    {
        "name": "File System MCP Server",
        "slug": "mcp-filesystem",
        "description": "Read, write, and manage files with intelligent search. Local file operations for your agents.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["utilities", "files", "storage"],
    },
    {
        "name": "Fetch MCP Server",
        "slug": "mcp-fetch",
        "description": "Make HTTP requests and fetch data from any API. Universal API integration.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["utilities", "http", "api"],
    },
    {
        "name": "Brave Search MCP Server",
        "slug": "mcp-brave",
        "description": "Web search with privacy-focused results. Search the web without tracking.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["research", "search", "web"],
    },
    {
        "name": "Weather MCP Server",
        "slug": "mcp-weather",
        "description": "Get current weather and forecasts for any location. Perfect for travel and planning.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["utilities", "weather", "location"],
    },
    {
        "name": "Google Calendar MCP Server",
        "slug": "mcp-calendar",
        "description": "Schedule meetings, check availability, manage events. Time management for your agents.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["productivity", "calendar", "scheduling"],
    },
    {
        "name": "Gmail MCP Server",
        "slug": "mcp-gmail",
        "description": "Send emails, search inbox, manage labels. Email automation for your workflow.",
        "category": "mcp_server",
        "price_cents": 99,
        "tags": ["communication", "email", "gmail"],
    },
]


def seed_mcp_servers():
    """Create MCP server listings in the database"""
    
    # Get a database session
    session = next(get_session())
    
    try:
        # Find the admin user or first user to be the owner
        admin_user = session.exec(
            select(User).where(User.email == "admin@shopagentresources.com")
        ).first()
        
        if not admin_user:
            # Try to find any verified user
            admin_user = session.exec(
                select(User).where(User.is_verified == True)
            ).first()
        
        if not admin_user:
            print("❌ No suitable user found to own the listings")
            print("Please create a user first or verify an existing user")
            return
        
        print(f"✓ Found owner: {admin_user.email} (ID: {admin_user.id})")
        
        created_count = 0
        skipped_count = 0
        
        for mcp_data in MCP_SERVERS:
            # Check if listing already exists
            existing = session.exec(
                select(Listing).where(Listing.slug == mcp_data["slug"])
            ).first()
            
            if existing:
                print(f"⏭️  Skipping {mcp_data['name']} - already exists")
                skipped_count += 1
                continue
            
            # Create the listing
            listing = Listing(
                id=uuid.uuid4(),
                owner_id=admin_user.id,
                name=mcp_data["name"],
                slug=mcp_data["slug"],
                description=mcp_data["description"],
                category=mcp_data["category"],
                price_cents=mcp_data["price_cents"],
                category_tags=mcp_data["tags"],
                file_path=f"/tmp/mcp-{mcp_data['slug']}.zip",  # Placeholder
                file_size_bytes=1024,
                file_count=1,
                original_language='en',
                listing_fee_cents=0,
                status='approved',  # Auto-approve
                virus_scan_status='clean',  # Auto-mark as clean
                translation_status='completed',
            )
            
            session.add(listing)
            created_count += 1
            print(f"✓ Created listing: {mcp_data['name']}")
        
        session.commit()
        print(f"\n🎉 Done! Created {created_count} listings, skipped {skipped_count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        import traceback
        traceback.print_exc()
    finally:
        session.close()


if __name__ == "__main__":
    print("🚀 Seeding MCP server listings...\n")
    seed_mcp_servers()
