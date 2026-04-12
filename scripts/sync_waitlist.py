#!/usr/bin/env python3
"""
Sync waitlist from production to dev environment.
Requires admin access to production.

Usage:
  export PROD_ADMIN_TOKEN=your_prod_token
  python sync_waitlist.py
"""

import os
import requests
import sys

PROD_API = "https://api.shopagentresources.com"
DEV_API = "https://agent-resources-api-dev-production.up.railway.app"

def get_prod_waitlist(token):
    """Fetch waitlist from production"""
    res = requests.get(
        f"{PROD_API}/admin/waitlist/",
        headers={"Authorization": f"Bearer {token}"}
    )
    res.raise_for_status()
    return res.json()["entries"]

def add_to_dev(email, source="website"):
    """Add entry to dev waitlist"""
    res = requests.post(
        f"{DEV_API}/waitlist/",
        json={"email": email, "source": source}
    )
    
    if res.status_code == 200:
        data = res.json()
        if data.get("status") == "already_registered":
            print(f"  ⚠️  {email} - already exists")
            return True
        print(f"  ✅ {email} - added")
        return True
    else:
        print(f"  ❌ {email} - failed: {res.status_code}")
        return False

def main():
    token = os.environ.get("PROD_ADMIN_TOKEN")
    if not token:
        print("Error: PROD_ADMIN_TOKEN environment variable required")
        print("\nTo get your token:")
        print("1. Login to production admin dashboard")
        print("2. Check browser localStorage for 'ar-admin-token'")
        print("3. Or use the login endpoint to get a token")
        sys.exit(1)
    
    print("Fetching production waitlist...")
    try:
        entries = get_prod_waitlist(token)
    except Exception as e:
        print(f"Error fetching from production: {e}")
        sys.exit(1)
    
    print(f"Found {len(entries)} entries in production\n")
    
    success = 0
    failed = 0
    skipped = 0
    
    for entry in entries:
        email = entry["email"]
        source = entry.get("source", "website")
        
        if add_to_dev(email, source):
            success += 1
        else:
            failed += 1
    
    print(f"\n{'='*50}")
    print(f"Total: {len(entries)}")
    print(f"Added: {success}")
    print(f"Failed: {failed}")
    
    # Check dev count
    res = requests.get(f"{DEV_API}/waitlist/count/")
    if res.ok:
        data = res.json()
        print(f"\nDev waitlist count: {data['count']}")
        print(f"Spots remaining: {data['spots_remaining']}")

if __name__ == "__main__":
    main()
