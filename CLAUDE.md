# CLAUDE.md - Critical Project Rules

> **READ THIS ENTIRE FILE BEFORE MAKING ANY CHANGES.**
> This project is LIVE IN PRODUCTION at https://qfifatdz.store
> Violations of these rules have caused production outages in the past.

---

## STOP - Pre-Flight Checklist

Before touching ANY code, verify these are all true:

```bash
# 1. supabase.php exists (THIS IS THE MOST CRITICAL FILE)
ls /home/qfifatdz.store/public_html/api/supabase.php

# 2. Supabase containers are healthy
docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase

# 3. API returns products
curl -s 'http://127.0.0.1:8001/rest/v1/products?select=name&limit=1' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.6lSuTFRlYlCyz-11MlN-drEefrFxB303__IibKbGbQc'

# 4. PHP proxy works end-to-end
curl -s 'https://qfifatdz.store/api/supabase.php/rest/v1/products?select=name&limit=1' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.6lSuTFRlYlCyz-11MlN-drEefrFxB303__IibKbGbQc'
```

If ANY of these fail, fix that FIRST before doing anything else.

---

## Architecture Overview

```
Browser
  |
  v
https://qfifatdz.store/api/supabase.php/rest/v1/products
  |
  v
PHP Proxy (supabase.php) -- adds CORS, handles file uploads
  |
  v
Kong API Gateway (127.0.0.1:8001)
  |
  v
PostgREST / GoTrue / Storage (Supabase Docker containers)
  |
  v
PostgreSQL (supabase-db container)
```

**The PHP proxy (`supabase.php`) is the single point of connection between the frontend and the database. If this file is missing or broken, the ENTIRE site shows empty pages with no products, no categories, nothing.**

---

## DO NOT TOUCH - Working Configuration

The following values are **correct and verified working**. Never change them.

### Kong API Gateway Port: `8001`
- PHP proxy target: `http://127.0.0.1:8001/` (file: `/home/qfifatdz.store/public_html/api/supabase.php`)
- Backend email service: `http://127.0.0.1:8001` (file: `/home/qfifatdz.store/qfifat-backend/.env`)

### ANON_KEY (used by Kong and frontend)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.6lSuTFRlYlCyz-11MlN-drEefrFxB303__IibKbGbQc
```

### SERVICE_ROLE_KEY (used by Kong and GoTrue admin API)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTg5MzQ1NjAwMH0.a1W1CG1s5Nb6OE6C-pfA3WSowzYhjCyhsi-_8E4ORkg
```

### JWT Secret (used by GoTrue)
```
H4oGrsmXWYh6Q7qPEHiX3qmP3UVtyiSr3mXHPGrNaNo=
```

### Frontend `.env` (file: `/home/qfifatdz.store/qfifat-real/.env`)
```env
VITE_SUPABASE_PROJECT_ID="qfifat-self-hosted"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.6lSuTFRlYlCyz-11MlN-drEefrFxB303__IibKbGbQc"
VITE_SUPABASE_URL="https://qfifatdz.store/api/supabase.php"
```

> **WARNING:** The `VITE_SUPABASE_URL` MUST be `https://qfifatdz.store/api/supabase.php`.
> Do NOT change it to `/supabase` or any other URL. The PHP proxy handles CORS and file uploads
> which the LiteSpeed proxy context does not.

---

## NEVER Change These Files Without Explicit User Request

| File | Purpose | What breaks if changed |
|------|---------|----------------------|
| `/home/qfifatdz.store/public_html/api/supabase.php` | PHP proxy to Kong | **Entire site goes blank** - no products, categories, auth |
| `/home/qfifatdz.store/public_html/.htaccess` | URL rewriting for SPA + API routing | Site navigation breaks, API calls fail |
| `/home/qfifatdz.store/public_html/auth.php` | Auth proxy for Supabase GoTrue | Login/signup breaks |
| `/home/qfifatdz.store/qfifat-real/.env` | Frontend Supabase connection | Frontend can't reach database |
| `/home/qfifatdz.store/qfifat-backend/.env` | Email service config | Emails stop sending |
| `/home/qfifatdz.store/supabase/docker/.env` | Supabase Docker config | See warning below |

---

## NEVER Run These Commands Without Explicit User Request

- `docker-compose up -d --force-recreate` (can break auth if .env is wrong)
- `docker-compose down` (takes entire backend offline)
- Any `DROP TABLE`, `TRUNCATE`, or `DELETE FROM` without WHERE clause
- Any changes to `auth.users` table directly
- `git clean`, `git reset --hard`, or anything destructive
- `rsync --delete` against `public_html/` (can delete supabase.php and other critical files)

---

## Build & Deploy Procedure (MANDATORY)

After ANY frontend code change, follow these EXACT steps:

### Step 1: Build
```bash
cd /home/qfifatdz.store/qfifat-real && npm run build
```

### Step 2: Deploy with `cp` (NEVER use rsync --delete)
```bash
cp -r /home/qfifatdz.store/qfifat-real/dist/* /home/qfifatdz.store/public_html/
```

> **WHY `cp` and not `rsync --delete`?**
> `rsync --delete` removes files in the destination that aren't in the source.
> `supabase.php`, `auth.php`, `.htaccess`, `product-images/`, `images/`, and `storage/`
> are NOT in the build output (`dist/`) but MUST remain in `public_html/`.
> Using `rsync --delete` (even with excludes) has caused production outages.

### Step 3: Verify deployment worked
```bash
# Confirm supabase.php still exists
ls /home/qfifatdz.store/public_html/api/supabase.php

# Confirm API still works
curl -s 'https://qfifatdz.store/api/supabase.php/rest/v1/products?select=name&limit=1' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.6lSuTFRlYlCyz-11MlN-drEefrFxB303__IibKbGbQc'
```

### Files that MUST survive deployment (never overwrite/delete):
| Path | Purpose |
|------|---------|
| `public_html/api/supabase.php` | PHP proxy to Supabase (CRITICAL) |
| `public_html/api/email.php` | Email API endpoint |
| `public_html/api/create-admin.php` | Server-side admin user creation (uses service_role key) |
| `public_html/auth.php` | Auth proxy |
| `public_html/.htaccess` | LiteSpeed rewrite rules |
| `public_html/images/` | Uploaded product images |
| `public_html/product-images/` | Static product images |
| `public_html/storage/` | File storage |

---

## Known PHP Proxy Limitations

The PHP proxy (`supabase.php`) has these known limitations that affect how you write frontend code:

### HEAD requests DO NOT work through the proxy
The proxy returns 502 on HEAD requests. This means:

**DO NOT use `head: true` in Supabase queries:**
```typescript
// BAD - will return null/0 counts
supabase.from("products").select("*", { count: "exact", head: true })

// GOOD - fetch IDs and count the array
supabase.from("products").select("id")
// then use: data?.length
```

This applies to ALL count queries across the entire application (HeroSection, AdminStats, AdminDashboard, etc.).

---

## Known .env Discrepancy (DO NOT "FIX")

- The Docker `.env` file at `/home/qfifatdz.store/supabase/docker/.env` has OLD/WRONG keys
- The RUNNING containers use DIFFERENT keys (listed above)
- Do NOT recreate containers from docker-compose, it will break everything
- If containers need recreating, update the Docker `.env` FIRST with the correct keys above

---

## Project Structure

```
/home/qfifatdz.store/
├── CLAUDE.md                           # THIS FILE - read before any changes
├── SERVER_DOCUMENTATION.md             # Full technical documentation
├── public_html/                        # LIVE site - served by LiteSpeed
│   ├── api/
│   │   ├── supabase.php                # PHP proxy -> Kong:8001 (CRITICAL - DO NOT DELETE)
│   │   ├── email.php                   # Email API endpoint
│   │   └── create-admin.php            # Server-side admin user creation (DO NOT DELETE)
│   ├── auth.php                        # Auth proxy (DO NOT DELETE)
│   ├── .htaccess                       # Rewrite rules (DO NOT DELETE)
│   ├── images/products/                # Product images (DO NOT DELETE)
│   ├── product-images/                 # Static product images (DO NOT DELETE)
│   ├── storage/                        # File storage (DO NOT DELETE)
│   ├── index.html                      # React app entry (from build)
│   └── assets/                         # Vite build output (from build)
├── qfifat-real/                        # Frontend source (React/Vite/TypeScript)
│   ├── src/
│   │   ├── data/wilayas.ts             # Shared wilayas constant (69 wilayas)
│   │   ├── pages/                      # Page components
│   │   └── components/                 # UI components
│   ├── .env                            # Frontend config (DO NOT CHANGE)
│   └── dist/                           # Build output -> cp to public_html
├── qfifat-backend/                     # Email service (Node.js, PM2: qfifat-email-service)
│   ├── server.js
│   └── .env
└── supabase/docker/                    # Self-hosted Supabase
    ├── docker-compose.yml
    ├── .env                            # WARNING: out of sync with running containers
    └── volumes/                        # Persistent data (PostgreSQL, Storage)
```

---

## Testing Credentials

### Admin Account
- **Email:** `admin@qfifat.test`
- **Password:** `Qfifat-Admin_S3cur3x2026`
- **Dashboard:** https://qfifatdz.store/admin

### Merchant Account
- **Email:** `merchant@qfifat.test`
- **Password:** `Qfifat-Merch_V3nd0rx2026`
- **Dashboard:** https://qfifatdz.store/merchant

### Customer Account
- **Email:** `client@qfifat.test`
- **Password:** `Qfifat-Client_Sh0pp3rx2026`

### Database Access
```bash
docker exec -it supabase-db psql -U postgres -d postgres
```

---

## Quick Verification Commands

```bash
# Check all containers are healthy
docker ps --format "table {{.Names}}\t{{.Status}}" | grep supabase

# Test API is working (direct to Kong)
curl -s 'http://127.0.0.1:8001/rest/v1/products?select=name&limit=1' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.6lSuTFRlYlCyz-11MlN-drEefrFxB303__IibKbGbQc'

# Test API through PHP proxy (what the frontend uses)
curl -s 'https://qfifatdz.store/api/supabase.php/rest/v1/products?select=name&limit=1' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.6lSuTFRlYlCyz-11MlN-drEefrFxB303__IibKbGbQc'

# Test login works
curl -s 'http://127.0.0.1:8001/auth/v1/token?grant_type=password' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE4OTM0NTYwMDB9.6lSuTFRlYlCyz-11MlN-drEefrFxB303__IibKbGbQc' \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@qfifat.test","password":"Qfifat-Admin_S3cur3x2026"}' | grep -o '"access_token"' && echo " OK" || echo " FAILED"

# Check product count
docker exec supabase-db psql -U postgres -d postgres -c "SELECT count(*) FROM products;"

# Check PHP proxy target port
grep 'targetUrl' /home/qfifatdz.store/public_html/api/supabase.php
```

---

## Shared Database Warning

**qfifatdz.store and himayaservice.com share the SAME Supabase instance** (same PostgreSQL, same Kong on port 8001). Both projects' tables coexist in the `public` schema.

- qfifat tables: `products`, `categories`, `orders`, `order_items`, `favorites`, `merchant_requests`, `reviews`, `coupons`, `payments`, etc.
- himaya tables: `providers`, `requests`, `services`, `conversations`, `messages`
- shared tables: `profiles`, `user_roles`, `notifications` (both projects write to these)

**Consequences:**
- NEVER delete users by email domain — they may belong to the other project
- The `get_admin_users_list()` DB function filters out `@himayatest.com`, `@himayaservice.com`, `@himaya.com` emails so qfifat admin only sees qfifat users
- NEVER drop or modify shared tables without checking both projects
- If you add columns to `profiles` or `user_roles`, verify they don't break himaya

---

## Custom Database Functions (created for admin features)

| Function | Purpose | Notes |
|----------|---------|-------|
| `get_admin_users_list()` | Returns qfifat users with email, role, profile data | SECURITY DEFINER, admin-only, filters out himaya users |
| `admin_update_profile(target_user_id, ...)` | Admin updates any user's profile | SECURITY DEFINER, admin-only |
| `admin_delete_user(target_user_id)` | Admin deletes a user (cascades via FK) | SECURITY DEFINER, admin-only, deletes from auth.users |
| `is_admin()` | Checks if current user has admin role | Used by RLS policies |
| `has_role(role)` | Checks if current user has a specific role | Used by RLS policies |

---

## Server-Side API Endpoints (PHP files in public_html/api/)

| File | Purpose | Auth |
|------|---------|------|
| `supabase.php` | Proxies ALL frontend Supabase calls to Kong:8001 | Passes through client JWT |
| `email.php` | Proxies to qfifat-backend email service on port 3020 | None |
| `create-admin.php` | Creates users via GoTrue Admin API without session change | Verifies caller is admin, uses service_role key server-side |

**`create-admin.php`** was created because `supabase.auth.signUp()` from the frontend automatically logs in as the new user, logging out the admin. The server-side endpoint uses the GoTrue Admin API which creates users without creating a session.

---

## Frontend Code Patterns

### Wilayas: Always import from shared constant
```typescript
import { wilayas } from "@/data/wilayas";
// Contains all 69 wilayas of Algeria (updated Nov 2025)
// Used in: Checkout, MyAddresses, AccountSettings, BecomeMerchant, UsersManagement
```

### Counting records: NEVER use head:true
```typescript
// BAD — PHP proxy returns 502 on HEAD requests
const { count } = await supabase.from("products").select("*", { count: "exact", head: true });

// GOOD — fetch IDs and count
const { data } = await supabase.from("products").select("id");
const count = data?.length || 0;
```

### Creating users server-side (admin)
```typescript
// BAD — logs out the admin
await supabase.auth.signUp({ email, password });

// GOOD — server-side creation, no session change
const { data: session } = await supabase.auth.getSession();
await fetch("/api/create-admin.php", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.session.access_token}` },
  body: JSON.stringify({ email, password, full_name, role: "admin" }),
});
```

### Role enum values
The `app_role` PostgreSQL enum is `{admin, user, merchant}`. Note: it's `"user"` NOT `"customer"`.

---

## Common Mistakes That Have Broken Production

| Mistake | What happened | How to avoid |
|---------|--------------|--------------|
| Using `rsync --delete` to deploy | Deleted `supabase.php` -> entire site blank | Always use `cp -r dist/* public_html/` |
| Changing `VITE_SUPABASE_URL` in `.env` | Frontend pointed to wrong endpoint -> blank site | Never change this value |
| Using `{ head: true }` in Supabase queries | PHP proxy returns 502 on HEAD -> counts show 0 | Use `.select("id")` then `.data?.length` |
| Using `supabase.auth.signUp()` for admin user creation | Logged out the admin, logged in as new user | Use `/api/create-admin.php` server-side endpoint |
| Using role value `"customer"` instead of `"user"` | Role counts always showed 0, role changes failed | The enum is `{admin, user, merchant}` — use `"user"` |
| Not verifying after deploy | Didn't catch that proxy was deleted | Always run verification commands after deploy |
| Running `docker-compose up --force-recreate` | Docker .env has wrong keys -> auth breaks | Never recreate without updating Docker .env first |
| Deleting users from shared DB | Would break himayaservice.com | Filter in queries, never bulk-delete users |
