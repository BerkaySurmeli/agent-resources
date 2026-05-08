from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from typing import List
from datetime import datetime
import zipfile
import io
import os
import httpx

from core.database import get_session
from core.config import settings
from models import Listing, User, Transaction
from routes.auth import get_current_user_from_token

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

# Minimum required OpenClaw version
MIN_OPENCLAW_VERSION = "0.1.0"

# Public API base URL for generated installer scripts
_API_BASE_URL = os.environ.get("PUBLIC_API_URL", "https://api.shopagentresources.com")


@router.get("/openclaw-version")
async def get_openclaw_version():
    """Get the latest OpenClaw version and download URLs"""
    try:
        # Try to fetch latest version from GitHub releases
        async with httpx.AsyncClient() as client:
            # GitHub API for latest release
            response = await client.get(
                "https://api.github.com/repos/openclaw/openclaw/releases/latest",
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                latest_version = data.get("tag_name", "v0.1.0").lstrip("v")
                
                return {
                    "min_version": MIN_OPENCLAW_VERSION,
                    "latest_version": latest_version,
                    "current_version_sufficient": True,  # Client should compare
                    "download_urls": {
                        "macos": "https://openclaw.ai/install.sh",
                        "linux": "https://openclaw.ai/install.sh",
                        "windows": "https://openclaw.ai/install.ps1"
                    },
                    "install_commands": {
                        "macos": "brew install openclaw/tap/openclaw",
                        "linux": "curl -fsSL https://openclaw.ai/install.sh | sh",
                        "windows": "irm https://openclaw.ai/install.ps1 | iex"
                    }
                }
    except Exception as e:
        # Fallback to static version if GitHub API fails
        pass
    
    # Fallback response
    return {
        "min_version": MIN_OPENCLAW_VERSION,
        "latest_version": MIN_OPENCLAW_VERSION,
        "download_urls": {
            "macos": "https://openclaw.ai/install.sh",
            "linux": "https://openclaw.ai/install.sh",
            "windows": "https://openclaw.ai/install.ps1"
        },
        "install_commands": {
            "macos": "brew install openclaw/tap/openclaw",
            "linux": "curl -fsSL https://openclaw.ai/install.sh | sh",
            "windows": "irm https://openclaw.ai/install.ps1 | iex"
        }
    }


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

        if not listing.product_id:
            raise HTTPException(status_code=400, detail=f"Listing {slug} is not yet available")

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
                readme_content = "# " + listing.name + "\n\n" + (listing.description or '')
                zip_file.writestr(f"{skill_dir}README.md", readme_content)
        
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
    # Sanitize values that go into YAML front matter (no newlines or colons that break YAML)
    safe_description = (listing.description or "AI agent from Agent Resources")[:80].replace('\n', ' ').replace(':', '-')
    
    return f'''---
name: {listing.slug}
description: {safe_description}
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


def _shell_safe_name(name: str) -> str:
    """Strip characters that could break shell echo statements"""
    import re
    return re.sub(r'[^a-zA-Z0-9 _\-.]', '', name)[:80]


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
        script += f'''
# Get latest OpenClaw version info from Agent Resources API
echo "🔍 Checking OpenClaw version..."
VERSION_INFO=$(curl -s "{_API_BASE_URL}/onboarding/openclaw-version" 2>/dev/null || echo '{{"min_version":"0.1.0"}}')
MIN_VERSION=$(echo "$VERSION_INFO" | grep -o '"min_version":"[^"]*"' | cut -d'"' -f4)
LATEST_VERSION=$(echo "$VERSION_INFO" | grep -o '"latest_version":"[^"]*"' | cut -d'"' -f4)
[ -z "$MIN_VERSION" ] && MIN_VERSION="0.1.0"
[ -z "$LATEST_VERSION" ] && LATEST_VERSION="$MIN_VERSION"

# Function to compare versions (using sort for version comparison)
version_ge() (
    test $(printf '%s' "$1" "$2" | sort -V | head -n1) = "$2"
)

# Check if OpenClaw is installed and get version
if command -v openclaw &> /dev/null; then
    CURRENT_VERSION=$(openclaw --version 2>/dev/null | grep -oE '[0-9]+[.][0-9]+[.][0-9]+' | head -1)
    if [ -z "$CURRENT_VERSION" ]; then
        CURRENT_VERSION="0.0.0"
    fi
    
    if version_ge "$CURRENT_VERSION" "$LATEST_VERSION"; then
        echo "✅ OpenClaw v$CURRENT_VERSION is up to date (latest: v$LATEST_VERSION)"
    elif version_ge "$CURRENT_VERSION" "$MIN_VERSION"; then
        echo "⚠️  OpenClaw v$CURRENT_VERSION works but v$LATEST_VERSION is available"
        echo "   Run openclaw update to upgrade, or continue with current version"
    else
        echo "📦 Updating OpenClaw from v$CURRENT_VERSION to v$LATEST_VERSION..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            brew upgrade openclaw/tap/openclaw 2>/dev/null || brew install openclaw/tap/openclaw
        else
            curl -fsSL https://openclaw.ai/install.sh | sh
        fi
    fi
else
    echo "📦 Installing OpenClaw v$LATEST_VERSION..."
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
        safe_name = _shell_safe_name(listing.name)
        script += f'''
echo "  Installing {safe_name}..."
cp -r "skills/{listing.slug}" ~/.openclaw/skills/
'''

    script += f'''
echo ""
echo "Setup complete!"
echo ""
echo "Installed agents:"
'''

    for listing in listings:
        safe_name = _shell_safe_name(listing.name)
        script += f'''echo "  - {safe_name}"
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

$MinVersion = "0.1.0"

function Compare-Version {{
    param($Version1, $Version2)
    $v1 = [Version]$Version1
    $v2 = [Version]$Version2
    return $v1 -ge $v2
}}

Write-Host "🚀 Setting up your AI team..." -ForegroundColor Cyan

'''
    
    if include_openclaw:
        script += f'''
# Get latest OpenClaw version info from Agent Resources API
Write-Host "Checking OpenClaw version..." -ForegroundColor Cyan
try {{
    $versionInfo = Invoke-RestMethod -Uri "{_API_BASE_URL}/onboarding/openclaw-version" -TimeoutSec 10
    $minVersion = $versionInfo.min_version
    $latestVersion = $versionInfo.latest_version
}} catch {{
    $minVersion = "0.1.0"
    $latestVersion = "0.1.0"
}}

# Check if OpenClaw is installed and get version
$openclawPath = Get-Command openclaw -ErrorAction SilentlyContinue
if ($openclawPath) {{
    try {{
        $versionOutput = openclaw --version 2>$null
        $currentVersion = ($versionOutput | Select-String -Pattern '([0-9]+[.][0-9]+[.][0-9]+)' | Select-Object -First 1).Matches.Groups[1].Value
        if (-not $currentVersion) {{ $currentVersion = "0.0.0" }}
    }} catch {{
        $currentVersion = "0.0.0"
    }}
    
    if (Compare-Version $currentVersion $latestVersion) {{
        Write-Host "✅ OpenClaw v$currentVersion is up to date (latest: v$latestVersion)" -ForegroundColor Green
    }} elseif (Compare-Version $currentVersion $minVersion) {{
        Write-Host "⚠️  OpenClaw v$currentVersion works but v$latestVersion is available" -ForegroundColor Yellow
        Write-Host "   Run 'openclaw update' to upgrade, or continue with current version" -ForegroundColor Gray
    }} else {{
        Write-Host "📦 Updating OpenClaw from v$currentVersion to v$latestVersion..." -ForegroundColor Yellow
        irm https://openclaw.ai/install.ps1 | iex
    }}
}} else {{
    Write-Host "📦 Installing OpenClaw v$latestVersion..." -ForegroundColor Yellow
    irm https://openclaw.ai/install.ps1 | iex
}}

'''
    
    script += f'''
# Create skills directory
$skillsDir = "$env:USERPROFILE/.openclaw/skills"
New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null

# Install skills
Write-Host "🤖 Installing {len(listings)} AI agents..." -ForegroundColor Cyan
'''
    
    for listing in listings:
        safe_name = _shell_safe_name(listing.name)
        script += f'''
Write-Host "  Installing {safe_name}..." -ForegroundColor Gray
Copy-Item -Path "skills/{listing.slug}" -Destination "$skillsDir/" -Recurse -Force
'''

    script += '''
Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
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
        readme += "- OpenClaw CLI installer" + "\n"
    
    readme += "- " + str(len(listings)) + " AI agents pre-configured:" + "\n"
    
    for listing in listings:
        readme += "  • " + listing.name + " (" + listing.category + ")" + "\n"
    
    readme += '''
SETUP INSTRUCTIONS:

macOS / Linux:
1. Open Terminal
2. Navigate to this folder: cd /path/to/this/folder
3. Run: chmod +x setup.sh && ./setup.sh

Windows:
1. Open PowerShell
2. Navigate to this folder: cd C:/path/to/this/folder
3. Run: ./setup.ps1

AFTER SETUP:
- OpenClaw will be installed (if not already)
- All AI agents will be ready to use
- Run: openclaw

SUPPORT:
https://shopagentresources.com/support
'''
    
    return readme