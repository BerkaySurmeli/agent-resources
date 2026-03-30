#!/bin/bash
# Test script for creating a listing

API_URL="https://api.shopagentresources.com"
TOKEN="$1"

if [ -z "$TOKEN" ]; then
    echo "Usage: $0 <auth_token>"
    exit 1
fi

# Create a temporary directory with SKILL.md
TMPDIR=$(mktemp -d)
echo "# Test Skill

This is a test skill for debugging.
" > "$TMPDIR/SKILL.md"

echo "Created test files in: $TMPDIR"
ls -la "$TMPDIR"

# Test the API
echo ""
echo "Testing /listings/create endpoint..."
curl -X POST "$API_URL/listings/create" \
    -H "Authorization: Bearer $TOKEN" \
    -F "name=Test Skill $(date +%s)" \
    -F "description=This is a test skill" \
    -F "category=skill" \
    -F "price_cents=4900" \
    -F "tags=[\"test\"]" \
    -F "files=@$TMPDIR/SKILL.md" \
    -v 2>&1 | tail -30

# Cleanup
rm -rf "$TMPDIR"
