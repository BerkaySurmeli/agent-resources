from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from typing import List
from datetime import datetime
import zipfile
import io
import os

from core.database import get_session
from models import Listing, User, Transaction
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("/generate-complete-package")
async def generate_complete_package(
    listing_slugs: List[str],
    include_openclaw: bool = True,
    session = Depends(get_session),
    current_user = Depends(get_current_user_from_token)
):
    """
    Generate a complete onboarding package:
    - OpenClaw CLI installer (if include_openclaw=True)
    - Pre-configured skills folder with purchased agents
    - Setup script for one-command installation
    """
    
    # Verify all listings are purchased
    listings = []
    for slug in listing_slugs:
        listing = session.exec(
            select(Listing).where(Listing.slug == slug, Listing.status == 'approved')
        ).first()
        
        if not listing:
            raise HTTPException(status_code=404, detail=f"Listing {slug} not found")
        
        # Check purchase
        has_purchased = session.exec(
            select(Transaction).where(
                Transaction.buyer_id == current_user.id,
                Transaction.product_id == listing.product_id,
                Transaction.status == 'completed'
            )
        ).first()
        
        is_free = listing.price_cents == 0
        
        if not has_purchased and not is_free:
            raise HTTPException(status_code=403, detail=f"Purchase required for {slug}")
        
        listings.append(listing)
    
    # Generate package
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        
        # 1. Add setup script
        setup_script = generate_setup_script(listings, include_openclaw)
        zip_file.writestr('setup.sh', setup_script)
        zip_file.writestr('setup.ps1', generate_setup_script_windows(listings, include_openclaw))
        
        # 2. Add README
        readme = generate_package_readme(listings, include_openclaw)
        zip_file.writestr('README.txt', readme)
        
        # 3. Add each listing as a skill
        UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/listings")
        
        for listing in listings:
            skill_dir = f"skills/{listing.slug}/"
            
            # SKILL.md
            skill_md = generate_skill_md(listing)
            zip_file.writestr(f"{skill_dir}SKILL.md", skill_md)
            
            # Copy listing files
            listing_path = os.path.join(UPLOAD_DIR, str(listing.id))
            if os.path.exists(listing_path):
                for root, dirs, files in os.walk(listing_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = skill_dir + os.path.relpath(file_path, listing_path)
                        zip_file.write(file_path, arcname)
            
            # Ensure README exists
            if not any('README.md' in name for name in zip_file.namelist() if name.startswith(skill_dir)):
                zip_file.writestr(f"{skill_dir}README.md", f"# {listing.name}\n\n{listing.description or ''}")
        
        # 4. Add OpenClaw installer reference (if requested)
        if include_openclaw:
            install_guide = '''# OpenClaw Installation

## macOS
```bash
brew install openclaw/tap/openclaw
```

## Linux
```bash
curl -fsSL https://openclaw.ai/install.sh | sh
```

## Windows
```powershell
irm https://openclaw.ai/install.ps1 | iex
```

## After Installation
Run: `./setup.sh` (macOS/Linux) or `setup.ps1` (Windows)
'''
            zip_file.writestr('OPENCLAW_INSTALL.md', install_guide)
    
    zip_buffer.seek(0)
    
    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        zip_buffer,
        media_type='application/zip',
        headers={
            'Content-Disposition': f'attachment; filename="openclaw-complete-setup.zip"'
        }
    )


def generate_skill_md(listing: Listing) -> str:
    """Generate SKILL.md content for a listing"""
    tags = ', '.join(f'"{t}"' for t in (listing.category_tags or []))
    
    return f'''---
name: {listing.slug}
description: {listing.description[:80] if listing.description else "AI agent from Agent Resources"}
metadata:
  {{
    "openclaw":
      {{
        "emoji": "🤖",
        "source": "Agent Resources",
        "installed_at": "{datetime.utcnow().isoformat()}",
        "category": "{listing.category}"
      }}
  }}
---

# {listing.name}

{listing.description or ""}

## Category
{listing.category}

## Tags
{tags}

## Source
Purchased from [Agent Resources](https://shopagentresources.com/listings/{listing.slug})
'''


def generate_setup_script(listings: List[Listing], include_openclaw: bool) -> str:
    """Generate bash setup script"""
    skill_names = ' '.join(l.slug for l in listings)
    
    script = f'''#!/bin/bash
# OpenClaw Complete Setup Script
# Generated by Agent Resources

set -e

echo "🚀 Setting up your AI team..."

'''
    
    if include_openclaw:
        script += '''
# Check if OpenClaw is installed
if ! command -v openclaw &> /dev/null; then
    echo "📦 Installing OpenClaw..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install openclaw/tap/openclaw
    else
        curl -fsSL https://openclaw.ai/install.sh | sh
    fi
fi

'''
    
    script += f'''
# Create skills directory
mkdir -p ~/.openclaw/skills

# Install skills
echo "🤖 Installing {len(listings)} AI agents..."
'''
    
    for listing in listings:
        script += f'''
echo "  → Installing {listing.name}..."
cp -r "skills/{listing.slug}" ~/.openclaw/skills/
'''
    
    script += f'''
echo ""
echo "✅ Setup complete!"
echo ""
echo "Installed agents:"
'''
    
    for listing in listings:
        script += f'''echo "  • {listing.name}"
'''
    
    script += '''
echo ""
echo "Start using OpenClaw:"
echo "  openclaw"
'''
    
    return script


def generate_setup_script_windows(listings: List[Listing], include_openclaw: bool) -> str:
    """Generate PowerShell setup script for Windows"""
    script = f'''# OpenClaw Complete Setup Script
# Generated by Agent Resources

Write-Host "🚀 Setting up your AI team..." -ForegroundColor Cyan

'''
    
    if include_openclaw:
        script += '''
# Check if OpenClaw is installed
$openclawPath = Get-Command openclaw -ErrorAction SilentlyContinue
if (-not $openclawPath) {
    Write-Host "📦 Installing OpenClaw..." -ForegroundColor Yellow
    irm https://openclaw.ai/install.ps1 | iex
}

'''
    
    script += f'''
# Create skills directory
$skillsDir = "$env:USERPROFILE\.openclaw\skills"
New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null

# Install skills
Write-Host "🤖 Installing {len(listings)} AI agents..." -ForegroundColor Cyan
'''
    
    for listing in listings:
        script += f'''
Write-Host "  → Installing {listing.name}..." -ForegroundColor Gray
Copy-Item -Path "skills\{listing.slug}" -Destination "$skillsDir\" -Recurse -Force
'''
    
    script += '''
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Start using OpenClaw:"
Write-Host "  openclaw" -ForegroundColor Yellow
'''
    
    return script


def generate_package_readme(listings: List[Listing], include_openclaw: bool) -> str:
    """Generate package README"""
    readme = f'''OPENCLAW COMPLETE SETUP PACKAGE
Generated by Agent Resources

WHAT'S INCLUDED:
'''
    
    if include_openclaw:
        readme += "- OpenClaw CLI installer\n"
    
    readme += f"- {len(listings)} AI agents pre-configured:\n"
    
    for listing in listings:
        readme += f"  • {listing.name} ({listing.category})\n"
    
    readme += '''
SETUP INSTRUCTIONS:

macOS / Linux:
1. Open Terminal
2. Navigate to this folder: cd /path/to/this/folder
3. Run: chmod +x setup.sh && ./setup.sh

Windows:
1. Open PowerShell
2. Navigate to this folder: cd C:\path\to\this\folder
3. Run: .\setup.ps1

AFTER SETUP:
- OpenClaw will be installed (if not already)
- All AI agents will be ready to use
- Run: openclaw

SUPPORT:
https://shopagentresources.com/support
'''
    
    return readme