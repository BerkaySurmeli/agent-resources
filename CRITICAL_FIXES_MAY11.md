# Critical Backend Fixes - May 11, 2026

## Overview
Implemented critical security and revenue protection fixes identified during codebase audit.

---

## ✅ Fix #1: Guest Download Token Expiry

### Problem
Guest download tokens never expired, allowing permanent free access after a single purchase. This creates revenue loss risk as guests have no incentive to create accounts for future purchases.

### Solution
- Added `expires_at` field to `GuestDownloadToken` model
- Set 90-day expiry when creating tokens (in webhook handler)
- Added expiry validation in download endpoint
- Returns HTTP 410 Gone with upgrade message when token expires

### Files Changed
1. **api/models.py** (line ~285)
   - Added `expires_at: Optional[datetime]` field to `GuestDownloadToken`

2. **api/routes/payments.py** (lines 535-545)
   - Import `timedelta` from datetime
   - Calculate `token_expiry = datetime.utcnow() + timedelta(days=90)`
   - Pass `expires_at=token_expiry` when creating token
   - Updated comment from "permanent" to "90-day expiry"

3. **api/routes/downloads.py** (lines 277-282)
   - Added expiry check: `if dl_token.expires_at and dl_token.expires_at < datetime.utcnow()`
   - Return 410 Gone with message: "Download link has expired. Please create an account to access your purchases."
   - Updated docstring to reflect 90-day expiry

4. **api/migrations/027_add_guest_token_expiry.sql** (NEW FILE)
   - Add `expires_at` column to existing table
   - Backfill existing tokens with `created_at + 90 days`
   - Add explanatory comment on column

### Impact
- **Revenue Protection**: Guests must create accounts after 90 days to re-download
- **UX Balance**: 90 days is generous for initial download needs
- **Account Growth**: Encourages conversion from guest → registered user
- **Fair to Existing Users**: Existing tokens get 90 days from purchase date, not from today

### Testing
```bash
# Run migration
psql $DATABASE_URL -f api/migrations/027_add_guest_token_expiry.sql

# Verify column added
psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='guest_download_tokens';"

# Check existing tokens got expiry set
psql $DATABASE_URL -c "SELECT count(*), count(expires_at) FROM guest_download_tokens;"
```

---

## ✅ Fix #2: Commission-Free Window (Already Implemented!)

### Initial Concern
Audit flagged that "100% payout for first 6 months" wasn't implemented in backend.

### Discovery
**The logic was already there!** In `api/routes/auth.py` lines 151-159:
```python
# Grant 6-month commission-free window for early signups within launch period
commission_free_until = None
if settings.LAUNCH_CUTOFF_DATE:
    try:
        cutoff = datetime.strptime(settings.LAUNCH_CUTOFF_DATE, "%Y-%m-%d")
        if datetime.utcnow() < cutoff:
            commission_free_until = datetime.utcnow() + timedelta(days=183)
    except ValueError:
        pass
```

### Configuration
- `LAUNCH_CUTOFF_DATE` is set to `"2026-11-05"` in `api/core/config.py`
- Since today is 2026-05-11, **all new signups automatically get 6 months commission-free**
- The `_seller_commission_rate()` function in `payments.py` correctly checks this field

### Status
✅ **No changes needed** - backend implementation matches frontend messaging

### Why This Works
1. New sellers signup between now and Nov 5, 2026
2. They automatically get `commission_free_until = now + 183 days`
3. When processing payments, `_seller_commission_rate(seller, session)` returns:
   - `0.0` if `seller.commission_free_until > now` ✓
   - `0.0` if seller has active Pro subscription ✓
   - `0.10` otherwise (standard 10% commission)

---

## Verification Checklist

### Pre-Deploy
- [ ] Run migration 027 in staging environment
- [ ] Verify existing guest tokens got `expires_at` backfilled
- [ ] Test guest download with expired token (should return 410)
- [ ] Test guest download with valid token (should work)
- [ ] Verify commission-free window is applied to new signups
- [ ] Check that Pro subscribers get 0% commission

### Post-Deploy
- [ ] Monitor webhook logs for successful token creation with expiry
- [ ] Verify no 500 errors from missing `expires_at` field
- [ ] Track guest → registered user conversion rate over 90 days
- [ ] Monitor support requests about expired download links

---

## Next Priority Fixes (From Audit)

### Critical (Still Pending)
1. **Add download button to success page** - Users shouldn't have to "check email" for instant downloads
2. **Backend password validation** - Frontend-only validation is insufficient
3. **Rate limiting** - Auth endpoints need protection beyond current implementation

### High Priority
1. **Cart persistence** - Sync to backend for logged-in users (currently localStorage only)
2. **Loading states** - Add spinners to "Add to Cart" buttons
3. **Reduce success page retries** - 8 retries is excessive, reduce to 3

---

## Success Metrics

### Revenue Protection (Guest Token Expiry)
- **Before**: Guests could re-download forever without paying again
- **After**: Guests must create account after 90 days
- **Expected Impact**: 20-30% of guests convert to registered users within 90 days

### Commission Structure (Verified Working)
- **Launch Period**: 0% commission for all sellers (until Nov 5, 2026)
- **Post-Launch**: 10% commission unless Pro subscriber
- **Messaging Alignment**: Homepage now correctly states "100% payout for first 6 months"

---

## Database Schema Changes

### New Field: `guest_download_tokens.expires_at`
```sql
ALTER TABLE guest_download_tokens ADD COLUMN expires_at TIMESTAMP;
```

### Migration Safety
- Non-breaking: Adds nullable column
- Backfills existing data: `created_at + 90 days`
- No foreign key changes
- No index changes required (low query volume on this table)

---

## Code Quality Notes

### Hook False Positives
The post-edit hook flagged `session.exec()` calls in downloads.py as security issues:
```
[CRITICAL] downloads.py:270 — eval()/exec() — use ast.literal_eval for data
```

**This is a false positive.** These are SQLModel's `session.exec()` database query methods, not Python's dangerous `exec()` builtin. The hook needs refinement to distinguish between:
- `exec("malicious code")` ❌ (dangerous)
- `session.exec(select(...))` ✅ (safe SQLModel ORM query)

### Code Comments Updated
- Changed "permanent guest download token" → "90-day expiry"
- Added docstring note about token expiration
- Updated migration comments for clarity

---

## Deployment Instructions

1. **Backup database** (critical before any schema change)
   ```bash
   pg_dump $DATABASE_URL > backup_before_027.sql
   ```

2. **Run migration**
   ```bash
   psql $DATABASE_URL -f api/migrations/027_add_guest_token_expiry.sql
   ```

3. **Verify migration**
   ```bash
   psql $DATABASE_URL -c "\d guest_download_tokens"
   ```

4. **Deploy code changes** (models.py, payments.py, downloads.py)

5. **Test critical paths**
   - New guest purchase → receives email with token
   - Guest clicks download link → file downloads
   - Expired token → receives 410 error with upgrade message

---

## Rollback Plan (If Needed)

If the migration causes issues:

```sql
-- Remove expires_at column
ALTER TABLE guest_download_tokens DROP COLUMN expires_at;

-- Revert code changes
git revert <commit-hash>
```

**Note**: This will make all guest tokens permanent again. Only rollback if there's a critical production issue.

---

## Documentation Updates Needed

### User-Facing
- [ ] Add FAQ: "How long are guest download links valid?"
- [ ] Update email template to mention 90-day expiry
- [ ] Add banner on success page: "Create an account to keep permanent access"

### Developer-Facing
- [ ] Update API documentation for `/downloads/guest/{token}` endpoint
- [ ] Document 410 Gone response code and error message
- [ ] Add migration 027 to deployment checklist

---

## Lessons Learned

1. **Read the code before assuming it's broken**: The commission-free window was already implemented correctly in auth.py. The audit flagged it based on incomplete file review.

2. **False positives in security tools**: Automated tools can't always distinguish safe ORM methods from dangerous builtins. Manual review is essential.

3. **Backfill with care**: Setting `expires_at = created_at + 90 days` for existing tokens is more fair than setting it to `now() + 90 days`, which would give different expiry periods based on when the migration runs.

4. **Migration comments matter**: Future developers will thank you for explaining *why* a field exists, not just *what* it is.

---

## Status Summary

✅ **Guest token expiry implemented**  
✅ **Commission-free window verified working**  
⏳ **Database migration ready to deploy**  
⏳ **Testing in staging environment**  

**Next Steps**: Run migration in staging, test download flows, then deploy to production.
