# Railway Volume Setup for Persistent File Storage

## Overview

Agent Resources requires persistent file storage for:
- Seller uploaded ZIP files (personas, skills, MCP servers)
- Download delivery to buyers
- File virus scanning

**Current Issue:** Files are stored in `/tmp/uploads` which is ephemeral (lost on redeploy).

## Solution: Railway Volume

### Step 1: Create Volume in Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project: `agent-resources-api-dev-production`
3. Click on the **"Volumes"** tab
4. Click **"New Volume"**
5. Configure:
   - **Mount Path**: `/app/uploads`
   - **Size**: Start with 10GB (can resize later)
   - **Region**: Same as your service (usually `us-west1`)

### Step 2: Update API Code

The downloads route already uses the `UPLOAD_DIR` environment variable:

```python
# In api/routes/downloads.py
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/uploads")
```

Update the Dockerfile or set environment variable:

```dockerfile
# In api/Dockerfile, add:
ENV UPLOAD_DIR=/app/uploads
```

Or set in Railway Dashboard:
- Go to service → Variables → Add
- Name: `UPLOAD_DIR`
- Value: `/app/uploads`

### Step 3: Update File Upload Routes

Ensure all file upload routes use the `UPLOAD_DIR`:

```python
# In api/routes/listings.py or wherever files are uploaded
import os
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/tmp/uploads")

# Ensure directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Save files to UPLOAD_DIR
file_path = os.path.join(UPLOAD_DIR, f"{listing_id}.zip")
```

### Step 4: Deploy

```bash
cd /Users/bsurmeli/.openclaw/workspace/agent-resources/api
railway up --detach
```

### Step 5: Verify Volume Mount

```bash
# SSH into Railway service (via Railway CLI)
railway connect

# Check if volume is mounted
ls -la /app/uploads
df -h
```

## Current Implementation Status

### ✅ Already Implemented

1. **Downloads Route** (`api/routes/downloads.py`):
   - Uses `UPLOAD_DIR` environment variable
   - Serves files securely with purchase verification
   - Tracks download counts

2. **Frontend Download Button** (`web/components/settings/PurchasesSection.tsx`):
   - Fetches purchases from `/downloads/my-purchases`
   - Shows download availability status
   - Handles file download with proper error handling

### ⚠️ Needs Verification

1. **File Upload Path**:
   - Check where listing files are saved during creation
   - Ensure they use `UPLOAD_DIR` environment variable

2. **Virus Scanning**:
   - Ensure scanned files remain in volume after scan

## Migration: Moving Existing Files

If you have files in `/tmp/uploads` that need to be preserved:

```bash
# SSH into Railway service
railway connect

# Copy files from old location to volume (if they exist)
cp -r /tmp/uploads/* /app/uploads/ 2>/dev/null || echo "No files to migrate"

# Verify
ls -la /app/uploads/
```

## Environment Variables Summary

| Variable | Value | Description |
|----------|-------|-------------|
| `UPLOAD_DIR` | `/app/uploads` | Persistent volume mount point |
| `DATABASE_URL` | (existing) | PostgreSQL connection |
| `STRIPE_SECRET_KEY` | (existing) | Stripe API key |

## Testing File Persistence

1. Create a test listing with file upload
2. Download the file (should work)
3. Redeploy the service: `railway up --detach`
4. Try downloading again (should still work if volume is configured)

## Troubleshooting

### Files not persisting after deploy
- Check if `UPLOAD_DIR` is set correctly
- Verify volume is mounted at `/app/uploads`
- Check logs: `railway logs`

### Permission errors
- Railway volumes are mounted with proper permissions by default
- If issues occur, check file ownership in the container

### Volume full
- Monitor volume usage in Railway dashboard
- Can resize up to 100GB without downtime

## Cost Considerations

- Railway volumes cost ~$0.10/GB/month
- 10GB = ~$1/month
- Bandwidth charges apply for file downloads

## Alternative: Cloud Storage (Future)

For larger scale, consider migrating to:
- **Cloudflare R2** (S3-compatible, zero egress fees)
- **AWS S3** + CloudFront CDN
- **Backblaze B2** (cheaper storage)

This would require:
1. Upload files to S3/R2 during listing creation
2. Generate signed URLs for downloads
3. Update download route to redirect to signed URL
