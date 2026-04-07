# Deploy to Hostinger Node.js — Step by Step

## Prerequisites
- Hostinger Business or Cloud plan (Node.js support required)
- Domain: payfast.10xdigitalventures.com subdomain created in cPanel
- MySQL database created in cPanel

---

## STEP 1 — MySQL Setup

1. cPanel → MySQL Databases → Create database: `payfast_ghl`
2. Create a DB user, assign ALL privileges
3. Go to phpMyAdmin → select `payfast_ghl` → SQL tab
4. Paste and run the contents of `scripts/setup.sql`

---

## STEP 2 — Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
GHL_CLIENT_ID=your_ghl_client_id
GHL_CLIENT_SECRET=your_ghl_client_secret
NEXT_PUBLIC_APP_URL=https://payfast.10xdigitalventures.com
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_cpanel_db_user
DB_PASSWORD=your_db_password
DB_NAME=payfast_ghl
SESSION_SECRET=generate_with_openssl_rand_base64_32
```

Generate SESSION_SECRET:
```bash
openssl rand -base64 32
```

---

## STEP 3 — Build Locally

```bash
npm install
npm run build
```

This creates `.next/standalone` folder (because of `output: 'standalone'` in next.config.js)

---

## STEP 4 — Upload to Hostinger

### Option A: Via SSH (recommended)
```bash
# Upload the whole project
scp -r . user@your-server:/home/user/payfast-ghl/

# SSH into server
ssh user@your-server

# Go to project
cd /home/user/payfast-ghl

# Install production deps
npm ci --production

# Build
npm run build
```

### Option B: Via File Manager
1. ZIP the project (exclude `node_modules`)
2. Upload to `~/payfast-ghl/`
3. Extract
4. SSH → `npm install && npm run build`

---

## STEP 5 — Configure Node.js App in Hostinger

1. Hostinger hPanel → **Node.js** section
2. Create app:
   - **Node.js version:** 20.x LTS
   - **Application root:** `/home/user/payfast-ghl`
   - **Application URL:** `payfast.10xdigitalventures.com`
   - **Application startup file:** `node_modules/.bin/next` or `server.js`
   - **Start command:** `npm start`
3. Set environment variables (same as .env.local)
4. Save & Start

---

## STEP 6 — Configure Subdomain SSL

1. cPanel → Subdomains → `payfast.10xdigitalventures.com`
2. SSL/TLS → Let's Encrypt → issue for subdomain
3. Force HTTPS redirect

---

## STEP 7 — CRM Marketplace App Config

In your CRM marketplace dashboard:
```
OAuth Redirect URI:  https://payfast.10xdigitalventures.com/oauth/callback
Webhook URL:         https://payfast.10xdigitalventures.com/api/payfast/itn
App URL:             https://payfast.10xdigitalventures.com
```

---

## STEP 8 — GoPayFast Dashboard Config

In your GoPayFast merchant dashboard:
```
Notification URL: https://payfast.10xdigitalventures.com/api/payfast/itn
Return URL:       https://payfast.10xdigitalventures.com/payments?status=success
Cancel URL:       https://payfast.10xdigitalventures.com/payments?status=cancelled
```

---

## STEP 9 — Test End-to-End

1. Visit: `https://payfast.10xdigitalventures.com/install`
2. Click "Connect & Authorize with CRM"
3. After OAuth → Settings page opens
4. Enter GoPayFast sandbox credentials
5. Payments → New Payment Link
6. Complete payment in sandbox
7. Check dashboard → payment should appear as synced

---

## Troubleshooting

| Issue | Fix |
|---|---|
| 502 Bad Gateway | Node app not running — check hPanel logs |
| DB connection error | Check DB_HOST=localhost, credentials |
| OAuth redirect mismatch | CRM app redirect URI must exactly match |
| ITN not firing | Check GoPayFast notification URL is set correctly |
| Signature mismatch | Ensure passphrase matches GoPayFast settings |
