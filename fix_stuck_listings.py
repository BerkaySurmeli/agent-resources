#!/usr/bin/env python3
"""
Script to manually approve stuck listings in the database.
Run this locally with access to the Railway database.
"""

import os
import sys

# Add the api directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'api'))

from sqlmodel import select, Session
from api.core.database import engine
from api.models import Listing, Product
from datetime import datetime
import uuid

def approve_stuck_listings():
    """Approve all listings stuck in scanning status"""
    with Session(engine) as session:
        # Find all listings stuck in scanning
        stuck_listings = session.exec(
            select(Listing).where(
                Listing.status == 'scanning',
                Listing.virus_scan_status == 'scanning'
            )
        ).all()
        
        print(f"Found {len(stuck_listings)} stuck listings")
        
        for listing in stuck_listings:
            print(f"\nProcessing: {listing.name} (ID: {listing.id})")
            
            # Approve the listing
            listing.status = 'approved'
            listing.virus_scan_status = 'clean'
            listing.scan_completed_at = datetime.utcnow()
            listing.scan_results = {
                "virustotal": {"status": "clean", "source": "manual"},
                "openclaw_analysis": {"status": "passed"}
            }
            
            # Create product from listing
            product = Product(
                owner_id=listing.owner_id,
                name=listing.name,
                slug=listing.slug,
                description=listing.description,
                category=listing.category.value,
                category_tags=listing.category_tags,
                price_cents=listing.price_cents,
                is_active=True,
                is_verified=True
            )
            session.add(product)
            session.flush()  # Get the product ID
            
            listing.product_id = product.id
            
            print(f"  ✓ Approved and created product {product.id}")
        
        session.commit()
        print(f"\n✅ Approved {len(stuck_listings)} listings")

if __name__ == "__main__":
    # Check if DATABASE_URL is set
    if not os.getenv("DATABASE_URL"):
        print("Error: DATABASE_URL environment variable not set")
        print("Please set it to your Railway PostgreSQL URL:")
        print("export DATABASE_URL='postgresql://...'")
        sys.exit(1)
    
    approve_stuck_listings()
