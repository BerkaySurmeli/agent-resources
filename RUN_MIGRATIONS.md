# Database Migration Instructions

## Problem
Railway trial has expired and deployment is FAILED. Cannot auto-deploy or connect to DB directly.

## Migrations to Run
There are 9 pending migrations (016-024) that need to be applied.

## Option 1: Railway Dashboard (Recommended)

1. Go to https://railway.app/dashboard
2. Select "Agent Resources" project
3. Go to your PostgreSQL database service
4. Click "Query" or "SQL Console" tab
5. Copy and paste the contents of `CONSOLIDATED_MIGRATIONS.sql`
6. Run the queries

## Option 2: Railway CLI (if you upgrade plan)

```bash
cd ~/.openclaw/workspace/agent-resources
railway up --detach
```

The app will auto-run migrations on startup via `run_migrations()` in `core/database.py`.

## Option 3: psql with Proxy

If you can get a direct connection string from Railway dashboard:

```bash
export DATABASE_URL="postgresql://..."
psql $DATABASE_URL -f CONSOLIDATED_MIGRATIONS.sql
```

## After Migrations

1. Update `ADMIN_SETUP_KEY` in Railway variables (currently set to weak default)
2. Redeploy the application
3. Verify health endpoint: `curl https://api.shopagentresources.com/health`

## Migration Summary

| Migration | Description |
|-----------|-------------|
| 016 | Fix transactions (multi-item cart, nullable buyer/seller) |
| 017 | Add developer code tracking to listings |
| 018 | Add developer profile fields |
| 019 | Add product view count |
| 020 | Add collections feature |
| 021 | Add product quality score |
| 022 | Add subscriptions (Pro plan) |
| 023 | Add waitlist invite tracking |
| 024 | Add password reset tokens |

## Waitlist Protection
✅ All migrations use `IF NOT EXISTS` / `IF EXISTS` — safe to re-run
✅ No data deletion — only ADD COLUMN and CREATE TABLE
✅ Waitlist table untouched except for adding invite columns
