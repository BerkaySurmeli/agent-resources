# Agent Resources Deployment Guide

## Prerequisites
- Domain registered (Cloudflare recommended)
- GitHub account
- Railway account
- Vercel account

---

## 1. Backend Deployment (Railway)

### Step 1: Create Project
```bash
cd /claw-base/api
```

### Step 2: Deploy to Railway
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Railway will detect `railway.json` and `Dockerfile`

### Step 3: Add PostgreSQL
1. In Railway dashboard, click "New" → "Database" → "Add PostgreSQL"
2. Copy the connection string
3. Add as environment variable: `DATABASE_URL`

### Step 4: Environment Variables
Add these in Railway dashboard:
```
DATABASE_URL=postgresql://...
SECRET_KEY=your-super-secret-key-change-in-production
PROJECT_NAME=Agent Resources
DB_ECHO=false
```

### Step 5: Run Migration
```bash
# In Railway shell or locally with prod DB
psql $DATABASE_URL -f migrations/001_initial_schema.sql
```

### Step 6: Verify
Visit `https://your-app.railway.app/health`

---

## 2. Frontend Deployment (Vercel)

### Step 1: Prepare
```bash
cd /claw-base/web
npm install
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repo
4. Vercel will detect `vercel.json`

### Step 3: Environment Variables
Add in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

### Step 4: Deploy
Vercel auto-deploys on every push to main branch.

---

## 3. Domain Setup (Cloudflare)

### Step 1: Add Custom Domain
1. In Vercel: Settings → Domains → Add `shopagentresources.com`
2. In Railway: Settings → Domains → Add `api.shopagentresources.com`

### Step 2: Configure DNS (Cloudflare)
```
Type: CNAME
Name: @
Target: cname.vercel-dns.com
Proxy: Enabled (orange cloud)

Type: CNAME
Name: api
Target: your-app.railway.app
Proxy: Enabled (orange cloud)
```

### Step 3: SSL/TLS
Cloudflare handles SSL automatically.

---

## 4. Post-Deployment Checklist

- [ ] Frontend loads at https://shopagentresources.com
- [ ] API responds at https://api.shopagentresources.com/health
- [ ] Database migrations applied
- [ ] Stripe Connect keys configured (for payments)
- [ ] First 100 developer signup flow tested

---

## Estimated Costs

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Vercel | Pro (if needed) | $0-20 |
| Railway | Starter | ~$5 |
| Cloudflare | Free | $0 |
| Domain | Registration | ~$9/year |
| **Total** | | **~$5-25/mo** |

---

## Troubleshooting

### CORS Issues
Add to `main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://shopagentresources.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Database Connection Fail
- Check `DATABASE_URL` format
- Ensure Railway Postgres is in same region as app

### Build Failures
- Check Vercel build logs
- Ensure `package.json` has correct build script
