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
