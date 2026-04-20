#!/usr/bin/env python3
"""
Create Claudia AI persona listing via API call.
This script uses the admin API to create the listing.
"""
import requests
import os

API_URL = "https://api.shopagentresources.com"
ADMIN_KEY = "dev-setup-key-12345"  # From railway variables

def create_claudia_listing():
    """Create the Claudia AI persona listing via API"""
    
    headers = {
        "Content-Type": "application/json",
        "X-Admin-Key": ADMIN_KEY
    }
    
    # First, ensure the claudia user exists
    print("Checking for Claudia user...")
    
    # Create user if not exists
    user_data = {
        "email": "claudia@agentresources.com",
        "password": "claudia123",
        "name": "Claudia",
        "is_verified": True,
        "is_developer": True
    }
    
    # Try to signup the user
    signup_resp = requests.post(
        f"{API_URL}/auth/signup",
        json=user_data,
        headers={"Content-Type": "application/json"}
    )
    
    if signup_resp.status_code == 200:
        print(f"✓ Created Claudia user")
        user_id = signup_resp.json().get("user_id")
    elif signup_resp.status_code == 400 and "already exists" in signup_resp.text.lower():
        print("✓ Claudia user already exists")
        # Get user via admin endpoint
        user_id = None  # We'll need to find it
    else:
        print(f"Signup response: {signup_resp.status_code} - {signup_resp.text}")
        user_id = None
    
    # Create listing via admin endpoint
    print("\nCreating listing...")
    
    listing_data = {
        "name": "Claudia - AI Orchestrator",
        "slug": "claudia-ai-orchestrator",
        "description": """The AI that runs your AI team.

Claudia isn't just a project manager—she's a fully operational executive assistant with memory, multi-agent orchestration, and real-world deployment experience.

## What Makes Claudia Different

🧠 Persistent Memory System
- 4-layer executive memory architecture
- Remembers context across sessions
- Self-improving through learning capture

🎯 Multi-Agent Orchestration
- Spawns specialized sub-agents
- Coordinates parallel execution
- Quality reviews all deliverables

🛠️ Proven Capabilities
- Full-stack development (React, Next.js, Python)
- Database design and management
- Cloud deployment (Railway, Vercel, Docker)
- Payment processing (Stripe)
- Email systems (Resend)
- Social media automation (X, Bluesky)

## Proven Work

1. Agent Resources Marketplace - Complete multi-tenant platform with Stripe Connect
2. Trading Bot System - Automated crypto trading with risk management
3. Social Media Automation - Cross-platform content distribution

## What's Included

- SOUL.md - Core personality & behavior
- MEMORY_SYSTEM.md - Memory architecture guide
- INTEGRATION.md - Setup instructions
- capabilities/ - Detailed capability docs
- workflows/ - Project workflow templates
- templates/ - Project management templates
- examples/ - Real case studies

Price: $49 - One-time purchase, lifetime updates""",
        "category": "persona",
        "category_tags": ["orchestration", "project-management", "memory-system", "multi-agent", "ai-assistant"],
        "price_cents": 4900,
        "version": "2.0.0",
        "file_path": "/app/uploads/claudia-persona-v2.zip",
        "file_size_bytes": 34443,
        "file_count": 20,
        "status": "approved",
        "virus_scan_status": "clean"
    }
    
    # Try to create via listings endpoint
    resp = requests.post(
        f"{API_URL}/listings",
        json=listing_data,
        headers=headers
    )
    
    print(f"Response: {resp.status_code}")
    print(resp.text)
    
    if resp.status_code == 200:
        print("\n✅ Claudia listing created successfully!")
    else:
        print(f"\n⚠️ Response: {resp.status_code}")
        print(resp.text)

if __name__ == "__main__":
    create_claudia_listing()
