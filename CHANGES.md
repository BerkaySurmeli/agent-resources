# Changes & Fixes

A full-pass audit and hardening of the Agent Resources marketplace codebase. Changes are grouped by severity, then file.

---

## Critical Security Fixes

### `api/core/config.py`
- **Added `ADMIN_SETUP_KEY` to Settings model.** Previously it was not a declared field, so code using `getattr(settings, 'ADMIN_SETUP_KEY', 'dev-setup-key-12345')` always fell through to the default hardcoded key in production. Any attacker who read the source code could call privileged admin endpoints. Now the field is declared and startup prints a warning when it is not configured.
- **Removed credential logging.** Startup previously printed `SECRET_KEY[:20]` (partial JWT signing key) and the hash of the SECRET_KEY to stdout, which Railway logs and forwards to any log aggregator. Removed.
- **Removed `.env` content logging.** Similar issue — startup was dumping loaded env values to stdout. Removed.

### `api/core/database.py`
- **Fixed connection pool exhaustion.** The original `get_session()` called `create_engine()` on every single request, creating a brand new connection pool each time and immediately discarding it. Under any real load this exhausted PostgreSQL's connection limit. Replaced with a single module-level shared engine using `QueuePool(pool_size=10, max_overflow=20, pool_pre_ping=True)`.

### `api/routes/waitlist.py`
- **Fixed unauthenticated waitlist delete.** `POST /waitlist/delete/` had zero authentication — anyone could remove any email from the waitlist by calling it directly. Now requires an `X-Setup-Key` header matching `settings.ADMIN_SETUP_KEY` and returns 403 otherwise.
- **Fixed per-module `create_engine` call.** This file had its own `get_db_session()` that called `create_engine()` on every request, separate from the shared engine bug above. Replaced with the shared `get_session()` from `core.database`.

### `api/routes/admin.py`
- **Fixed all setup endpoints to use `settings.ADMIN_SETUP_KEY` directly** and block (`403`) when the key is empty. Previously every endpoint used `getattr(settings, 'ADMIN_SETUP_KEY', 'dev-setup-key-12345')`, meaning the hardcoded fallback was always active when `ADMIN_SETUP_KEY` was not set in the environment.
- **Added admin auth to `/admin/run-migration`.** This endpoint previously had no authentication at all — any unauthenticated caller could trigger arbitrary SQL migrations. Now requires a valid admin JWT.
- **Removed `debug-admin` endpoint.** This endpoint had a hardcoded production password (`"16384bEr32768!"`) in the source code for "testing". Removed entirely.
- **Fixed Claudia seed user password.** The first `seed-claudia` implementation stored `password_hash='claudia123'` as plaintext in the database. The seed now generates a random 32-byte hex password and hashes it with argon2 — the account is not intended for interactive login.
- **Removed duplicate `@router.post("/seed-claudia")` registration.** There were two route definitions with the same path (lines ~973 and ~1555). FastAPI silently uses the first one; the second was dead code that shadowed the first and would have caused confusion. The second (less correct) implementation was removed.
- **Fixed path traversal in admin file upload endpoint.** `admin/upload-file` was joining `upload_dir + file.filename` without sanitization. Now uses `os.path.basename()` to strip any path components from the uploaded filename.
- **Removed credential log lines from admin login handler.** `[ADMIN LOGIN] Hash starts with: {hash[:50]}...` was logging password hash prefixes for every login attempt.

### `api/routes/listings.py`
- **Fixed path traversal in file upload.** `file_path = os.path.join(listing_dir, file.filename)` with no sanitization allowed a crafted filename like `../../etc/cron.d/evil` to escape the upload directory. Now strips path components with `os.path.basename()` and removes `..` sequences before writing.
- **Added 50 MB upload size limit.** Enforced cumulatively across all files in a single upload. Returns HTTP 400 if exceeded, cleans up the temp directory.
- **Fixed `files` variable shadowing.** The `os.walk()` loop inside `create_listing` used `files` and `file` as loop variables, shadowing the `files: List[UploadFile]` parameter. Renamed inner variables to `dir_files` and `fname` to eliminate the shadowing.
- **Fixed reviews not deleted before product deletion.** `delete_listing` was calling `session.exec(select(Review)...)` but discarding the result without deleting any rows, then calling `session.delete(product)`. This would crash with a foreign key constraint violation. Reviews are now properly fetched and deleted before the product.

### `api/routes/auth.py`
- **Removed credential logging.** Login was printing `token[:50]` and `SECRET_KEY[:10]` to stdout on every successful login.
- **Fixed `get_password_hash` helper.** The helper was truncating passwords to 72 bytes (`password[:72]`) — a bcrypt artifact. Since the app uses argon2, which has no such limit, the truncation was unnecessary and could silently produce different hashes than expected for passwords over 72 bytes. Removed the truncation.
- **Standardized to `get_password_hash()` everywhere.** Signup and change-password both now use the `get_password_hash()` helper instead of calling `pwd_context.hash()` directly.
- **Cleaned up noisy debug logging.** Removed `[AUTH DEBUG]` prints for every token validation (user_id, success/failure).

### `api/routes/payments.py`
- **Added idempotency to webhook handler.** Stripe guarantees at-least-once delivery, so `checkout.session.completed` can fire more than once for the same payment. Previously the handler created a new `Transaction` record and incremented `download_count` on every delivery. Now checks for an existing `Transaction` with the same `(stripe_payment_intent_id, product_id)` before inserting, and skips duplicate deliveries.

### `api/routes/products.py`
- **Fixed reviews not deleted before product deletion.** Same bug as in `listings.py` — `session.exec(select(Review)...)` result was discarded without deleting anything, making `DELETE /products/{slug}` crash with a FK constraint violation. Fixed.

### `api/routes/downloads.py`
- **Fixed double `download_count` increment.** The payment webhook already increments `product.download_count` when a purchase completes. The download endpoint was also incrementing it on every file download. This made the count reflect "number of times file was downloaded" rather than "number of purchases", and doubled counts on first download. Removed the increment from the download endpoint.

### `api/main.py`
- **Removed `/test-auth` and `/test-deploy` endpoints.** Dead debug routes with no purpose in production.
- **Removed redundant `create_engine` in lifespan.** The `lifespan` context manager was calling `create_engine()` and storing the result in `app.state.engine` which nothing ever used, while all actual DB access was going through the separate engine in `core.database`. Removed the redundant engine creation.

### `api/services/translation.py`
- **Replaced blocking `requests` with `httpx`.** `translate_text()` and `detect_language()` were called from inside `TranslationQueue._process_translation()`, which is an async method. Synchronous `requests.post()` blocks the entire async event loop for the duration of each HTTP call (up to 30 seconds). Replaced with `httpx.Client` (synchronous but non-blocking in a thread context, and a direct drop-in for the function signatures used here).

---

## Third Pass: Dead Code, Session Leak, Unregistered Router, Config Noise

### `api/routes/payments_connect.py` — DELETED
- **Deleted dead code file.** This file was never imported in `main.py`, so none of its routes were ever served. It contained 5 separate bugs: `await request.body()` called without `await` (sync handler), `Product` not imported, `asyncio.create_task()` called from a synchronous context, wrong `get_current_user` function signature, and hardcoded production URLs. Removing it eliminates future confusion and the risk of someone accidentally importing it.

### `api/routes/payments.py`
- **Fixed session leak in webhook handler.** `handle_successful_payment` used `next(get_session())` to obtain a DB session — this bypasses the context manager and the session is never properly closed or returned to the pool if an exception occurs before `db_session.close()`. Replaced with `with Session(engine) as db_session:` which guarantees cleanup. Also removed the now-redundant manual `rollback()` / `close()` calls in the finally block (the context manager handles both).

---

## Fourth Pass: Remaining Session Leaks

### `api/routes/listings.py`
- **Fixed session leak in `TranslationQueue._process_translation`.** Like `_process_scan`, the translation background worker used `next(get_session())` with a manual `finally: session.close()`. Replaced with `with DBSession(engine) as session:`. The error-path status update (marking translation as `'failed'`) now opens a fresh session rather than reusing a potentially broken one.
- **Fixed session leak in `ScanQueue._process_scan`.** Same `next(get_session())` pattern replaced with `with DBSession(engine) as session:`.

### `api/routes/waitlist.py`
- **Fixed three session leaks.** All three route handlers (`join_waitlist`, `get_waitlist_count`, `delete_from_waitlist`) used `next(get_session())` with `finally: session.close()`. All replaced with `with DBSession(engine) as session:` context managers. Also updated top-level imports to use `engine` directly instead of `get_session`.

---

## Fifth Pass: Frontend Debug Logging and Hardcoded URLs

### `web/pages/login.tsx`
- **Removed debug `console.log` calls.** Four `[LOGIN]` log statements were left in the login handler, logging form submission, success, and redirect events to the browser console in production. Removed.

### `web/pages/admin/login.tsx`
- **Removed debug `console.log` calls.** Same pattern — four `[ADMIN LOGIN]` statements in the admin login handler. Removed.

### `web/pages/index.tsx`
- **Fixed hardcoded API URLs.** The landing page waitlist fetch calls (`/waitlist/count/` and `/waitlist/`) were hardcoded to `https://api.shopagentresources.com` rather than using `NEXT_PUBLIC_API_URL` like every other page in the project. Added `const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.shopagentresources.com'` and updated all three fetch calls to use it.

### `api/routes/onboarding.py`
- **Registered in `main.py`.** The entire `/onboarding/*` router was never mounted — `generate-complete-package` and `openclaw-version` endpoints were unreachable. Added to `main.py`.
- **Removed hardcoded Railway dev URL from generated scripts.** The bash and PowerShell installer scripts embedded a literal `https://agent-resources-api-dev-production.up.railway.app` URL. Scripts sent to end-users would always point at the dev server. Now reads `PUBLIC_API_URL` env var (defaulting to the production URL) so the right endpoint is used per environment.

### `api/core/config.py`
- **Removed noisy module-level print statements.** Two `print()` calls ran unconditionally at import time, logging `SECRET_KEY configured: True` and `CLOUDFLARE_API_TOKEN configured: True/False` on every cold start and every import in tests. The meaningful warnings (RESEND key missing, ADMIN_SETUP_KEY missing) are already inside `__init__` — the redundant lines are removed.

### `web/pages/dashboard/products/[slug].tsx`
- **Fixed "Price (cents)" edit field.** The edit form for price showed a raw integer cents field labelled "Price (cents)" — confusing and error-prone for sellers. Replaced with a dollar-denominated `$X.XX` input that converts to/from cents on change.
- **Fixed invisible reviewer name.** Review author names were rendered `text-slate-900` (near-black) against a dark `bg-white/5` card, making them invisible. Changed to `text-white`.

---

## Second Pass: Multi-item Cart & Frontend Fixes

### `api/models.py`
- **Fixed `Transaction.stripe_payment_intent_id` unique constraint.** The column had `unique=True`, which is a DB-level single-column unique index. A Stripe checkout for multiple items produces one `payment_intent_id` shared by all line items. The webhook creates one `Transaction` per listing, so the second insert would violate the constraint and crash the entire multi-item purchase. Changed to `index=True` (plain index, no uniqueness) — idempotency is enforced by a new composite index on `(stripe_payment_intent_id, product_id)` instead, which is what the webhook guard in `payments.py` actually queries.
- **Made `buyer_id` and `seller_id` Optional.** Both were declared as non-Optional `UUID`, but `delete_account` in `auth.py` was setting them to `None` to anonymize historical transaction records without deleting them. This would fail at the SQLModel validation layer. Changed to `Optional[UUID]` to match the actual intent.

### `api/migrations/016_fix_transactions_schema.sql`
- **New migration** to apply the model changes above to an existing database: drops the `NOT NULL` constraints on `buyer_id`/`seller_id`, drops the single-column unique constraint on `stripe_payment_intent_id`, and creates the composite `uq_transactions_intent_product` unique index.

### `web/pages/cart.tsx`
- **Removed misleading platform fee line.** The order summary was showing "Platform Fee (10%)" as a buyer cost, which is incorrect — the 10% fee is deducted from the seller's payout. Buyers pay the listed price, full stop. Removed the fee row and updated the copy.

### `web/pages/dashboard.tsx`
- **Removed debug `console.log`** that was logging all fetched listing objects to the browser console in production.
- **Fixed broken "Pay Fee" button.** The button had no `onClick` handler — clicking it did nothing. Wired it to a new `handlePayFee()` function that calls `POST /listings/{id}/pay-fee` and refreshes the dashboard on success.

### `web/pages/admin/dashboard.tsx`
- **Fixed wrong Cloudflare metrics endpoint.** The admin UI was calling `/admin/metrics/cloudflare` (which doesn't exist); the actual backend route is `/admin/metrics/`. Fixed.
- **Removed hardcoded production URL.** The listing "View" link was pointing to `https://shopagentresources.com/listings/${id}` — a hardcoded production domain. Changed to a relative `/listings/${id}` path so it works in any environment.

### `web/components/settings/PurchasesSection.tsx`
- **Fixed broken "View details" link.** The link navigated to `/products/${slug}` but listing detail pages are served at `/listings/${slug}`. Fixed to use the correct path.

---

## Summary

| Area | Issues Fixed |
|---|---|
| Secret leakage in logs | 4 locations removed |
| Unauthenticated admin endpoints | 3 endpoints secured |
| Hardcoded credentials | 2 removed (debug_admin password, claudia seed plaintext hash) |
| Path traversal | 2 upload endpoints (listings + admin) |
| DB connection exhaustion | 2 per-request engine creations replaced with shared pool |
| FK constraint crashes | 3 delete endpoints (listings, products, admin cleanup) |
| Duplicate data on retry | 1 webhook idempotency fix |
| Double counter increment | 1 download_count fix |
| Event loop blocking | 1 translation service (requests → httpx) |
| Dead / duplicate code | 3 removed (test endpoints, duplicate route, redundant engine) |
| Dead code with 5 bugs | payments_connect.py deleted |
| Session leak in webhook | next(get_session()) → Session(engine) context manager |
| Session leaks in background workers | _process_scan and _process_translation in listings.py fixed |
| Session leaks in waitlist routes | 3 handlers in waitlist.py fixed |
| Debug console.log in login pages | Removed from login.tsx and admin/login.tsx |
| Hardcoded API URL on landing page | index.tsx now uses NEXT_PUBLIC_API_URL env var |
| Unregistered router | /onboarding/* endpoints now reachable |
| Hardcoded dev URL in scripts | PUBLIC_API_URL env var used in installer scripts |
| Config noise on import | 2 redundant print() calls removed |
| Invisible UI text | Review author name color fixed |
| Confusing price field | Price edit now shows $USD not raw cents |
| Multi-item cart crash | Transaction unique constraint replaced with composite index |
| Account deletion crash | buyer_id/seller_id made Optional to allow anonymization |
| Wrong API endpoint | Admin Cloudflare metrics URL corrected |
| Broken frontend links | Products detail link, admin listing view link fixed |
| Missing button handler | Dashboard "Pay Fee" button wired to backend |
| Misleading UI copy | Cart platform fee row removed (fee is seller-side, not buyer-side) |
