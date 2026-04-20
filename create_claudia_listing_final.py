#!/usr/bin/env python3
"""
Create Claudia AI persona listing via admin API.
"""
import requests
import os

API_URL = "https://api.shopagentresources.com"
ADMIN_SETUP_KEY = "dev-setup-key-12345"

def create_claudia_listing():
    """Create the Claudia AI persona listing via admin API"""
    
    headers = {
        "X-Setup-Key": ADMIN_SETUP_KEY
    }
    
    # Use the seed-mcp-servers endpoint pattern
    # First, let's check if there's a user we can use
    print("Creating Claudia listing via admin endpoint...")
    
    # Create listing data matching the expected format
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
        "price_cents": 4900,
        "tags": ["orchestration", "project-management", "memory-system", "multi-agent", "ai-assistant"]
    }
    
    # Try to call a custom endpoint or use existing ones
    # Let's try the admin seed endpoint with Claudia data
    resp = requests.post(
        f"{API_URL}/admin/seed-claudia",
        json=listing_data,
        headers=headers
    )
    
    print(f"Response: {resp.status_code}")
    print(resp.text)

if __name__ == "__main__":
    create_claudia_listing()
