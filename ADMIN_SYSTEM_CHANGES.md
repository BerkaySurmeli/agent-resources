# Separate Admin Authentication System - Changes Summary

## Overview
Created a completely separate admin authentication system with its own database table, separate from regular users.

## Changes Made

### 1. Database Models (`api/models.py`)
- **Removed** `is_admin` and `is_master_admin` fields from `User` model
- **Added** new `AdminUser` model with:
  - `id`: UUID primary key
  - `email`: Unique email address
  - `password_hash`: Hashed password
  - `name`: Optional display name
  - `is_master_admin`: Boolean flag for master admin privileges
  - `created_at`: Timestamp
  - `last_login`: Optional timestamp

### 2. Database Migrations
- **`011_create_admin_users_table.sql`**: Creates the `admin_users` table with indexes
- **`012_remove_admin_fields_from_users.sql`**: Removes `is_admin` and `is_master_admin` columns from `users` table

### 3. API Routes (`api/routes/admin.py`)
Complete rewrite to support separate admin authentication:
- **`POST /admin/login`**: Admin-only login using `admin_users` table
- **`GET /admin/validate`**: Validate admin JWT token
- **`GET /admin/dashboard`**: Dashboard stats (requires admin auth)
- **`GET /admin/users`**: List regular users
- **`GET /admin/admins`**: List admin users
- **`DELETE /admin/users/{id}`**: Delete regular user
- **`DELETE /admin/admins/{id}`**: Delete admin user (master admin only)
- **`GET /admin/developers`**: List developers
- **`GET /admin/listings`**: List all listings
- **`GET /admin/sales`**: List all sales
- **`GET /admin/sales/recent`**: List recent sales
- **`GET /admin/metrics/cloudflare`**: Cloudflare analytics

Admin tokens include `"type": "admin"` in the JWT payload to distinguish from regular user tokens.

### 4. Regular Auth Updates (`api/routes/auth.py`)
- Removed `is_admin` and `is_master_admin` from `UserResponse` model
- Removed admin fields from login/signup responses

### 5. Frontend - Admin Auth Context (`web/context/AdminAuthContext.tsx`)
New context for admin authentication:
- Separate state management for admin users
- Separate localStorage keys (`ar-admin`, `ar-admin-token`)
- `login()`, `logout()` functions
- `useAdminAuth()` hook

### 6. Frontend - Admin Login Page (`web/pages/admin/login.tsx`)
New admin-only login page at `/admin/login`:
- Uses `AdminAuthContext` for authentication
- On success, redirects to `/admin/dashboard`
- Link back to regular login page

### 7. Frontend - Admin Dashboard (`web/pages/admin/dashboard.tsx`)
Updated to use new admin authentication:
- Uses `useAdminAuth()` hook
- Checks for admin token in API requests
- Added logout button
- Removed hardcoded admin email check
- Added "Admins" section to view/manage admin users

### 8. Frontend - Regular Auth Context (`web/context/AuthContext.tsx`)
- Removed `isAdmin` and `isMasterAdmin` from `User` interface
- Removed admin fields from login/signup handling

### 9. Frontend - Regular Login Page (`web/pages/login.tsx`)
- Removed admin redirect logic
- Regular users always redirect to home page (`/`)

### 10. Frontend - App Wrapper (`web/pages/_app.tsx`)
- Added `AdminAuthProvider` wrapper

### 11. Admin Creation Script (`api/create_admin.py`)
Script to create the default master admin user:
- Email: `berkaysurmeli@icloud.com`
- Password: `16384bEr32768!`
- Properly hashes password using argon2

## Security Features

1. **Separate Authentication Systems**: Regular users and admins use completely separate tables and tokens
2. **Token Type Validation**: Admin tokens include `"type": "admin"` in JWT payload
3. **No Cross-Access**: Regular users cannot access admin routes, admin tokens don't work on regular routes
4. **Master Admin Protection**: Last master admin cannot be deleted
5. **Self-Deletion Protection**: Admins cannot delete their own account

## Default Admin Credentials

- **Email**: `berkaysurmeli@icloud.com`
- **Password**: `16384bEr32768!`
- **Role**: Master Admin

## Deployment Steps

1. Run migrations (automatic on API startup):
   ```bash
   cd api && python -c "from core.database import run_migrations; run_migrations()"
   ```

2. Create the default admin user:
   ```bash
   cd api && python create_admin.py
   ```

3. Deploy API and Web frontend

## Testing

1. **Regular User Login**: Should work at `/login` and redirect to `/`
2. **Admin Login**: Should work at `/admin/login` and redirect to `/admin/dashboard`
3. **Cross-Access Test**: 
   - Try accessing `/admin/dashboard` with regular user token → Should redirect to login
   - Try accessing regular API endpoints with admin token → Should fail with 401/403
4. **Admin Dashboard**: Should display all sections and allow user/admin management
