# API Reference - GoPayFast Connect

Complete reference of internal API endpoints used by the application and external integrations.

## 🛠 General API Settings
- **Base URL:** `https://your-domain.com/api`
- **Auth:** Most endpoints require a valid session cookie.
- **Format:** JSON Request/Response.

---

## 💳 GHL Native Integration (Provider API)
These endpoints are called by GHL servers.

### 1. Payment Query (queryUrl)
`POST /api/ghl/query`
Used by GHL to verify payments and manage payment methods.
- **Payload:** `{ "type": "verify" | "refund" | "list_payment_methods", ... }`
- **Verify Response:** `{ "success": boolean, "failed": boolean }`

### 2. Webhook Receiver
`POST /api/ghl/webhooks`
Receives real-time events from GHL.
- **Security:** Verified via `X-GHL-Signature` (Ed25519).
- **Events Handled:** `AppInstall`, `AppUninstall`, `ContactUpdate`, etc.

### 3. Provisioning
`POST /api/ghl/provider/provision`
Manually triggers the GHL provider association and config flow.

---

## 📦 Feature APIs

### 1. Products & Prices
- `GET /api/products`: Returns merged list of GHL and local products.
- `POST /api/products`: Creates a product in both local DB and GHL.

### 2. Invoices
- `POST /api/invoices`: Creates a native GHL invoice and saves a local copy.

### 3. Text2Pay
- `POST /api/text2pay`: Creates a temporary GHL product/price and sends an SMS via GHL.

### 4. GHL Sync
- `POST /api/ghl/notify`: Internal endpoint to signal GHL that a payment was captured.
- `POST /api/ghl/pay`: Initiates a PayFast session for GHL checkout.

---

## 🏢 Agency & Admin APIs

### 1. Agency Billing
- `GET /api/agency/summary`: Fetch MRR and wallet stats.
- `POST /api/agency/saas/enable-location`: Enable SaaS for a specific sub-account.

### 2. Merchant Onboarding
- `POST /api/apply`: Submit merchant application.
- `GET /api/admin/applications`: List all pending applications.
- `POST /api/admin/applications/[id]`: Update application status and inject credentials.

---

## 🔐 Auth APIs
- `POST /api/auth/logout`: Clears session and redirects.
