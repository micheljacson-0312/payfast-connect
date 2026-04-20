# GoPayFast Connect - Technical Documentation

This document serves as the living technical reference for the GoPayFast Connect codebase.

## 🏗 System Architecture
The application acts as a middleware between **GoPayFast** (Payment Gateway), **GHL** (CRM), and the **Agency/Merchant** (Users).

### Core Modules
1. **Auth & Session:** Handles OAuth 2.0 flows for GHL and JWT-based sessions for internal users.
2. **Payment Engine:** Manages PayFast ITN (Instant Payment Notification) and payment link generation.
3. **GHL Provider:** Implements the "Custom Payment Provider" specification for native GHL integration.
4. **Agency Console:** Manages SaaS billing, wallet balance, and agency-level settings.
5. **Merchant Pipeline:** Handles the application $\rightarrow$ review $\rightarrow$ provisioning lifecycle.

## 🔌 GHL Integration Details

### 1. Custom Payment Provider Flow
The app is registered as a Third-Party Provider in the GHL Marketplace.
- **Provisioning:** Triggered on install or config save. Calls `/payments/custom-provider/provider` and `/connect`.
- **Capabilities:** Configured for `payments`, `orders`, `subscriptions`, and `refunds`.
- **Checkout:** GHL loads `/ghl-checkout` in an iFrame. The page communicates via `window.postMessage` using events:
    - `custom_provider_ready` $\rightarrow$ `payment_initiate_props` $\rightarrow$ `custom_element_success_response`.

### 2. Native API Sync
- **Products:** When a product is created locally, it's mirrored in GHL using `/products` and `/prices` APIs.
- **Invoices:** Invoices created in the app are pushed to GHL via `/invoices` and can be sent natively.
- **Orders:** Payment capture triggers a call to `/payments/orders/{id}/record-payment` to mark orders as Paid.
- **Conversations:** Text2Pay uses `/conversations/messages` to send SMS payment links.

### 3. SaaS & Agency API
- Uses specialized agency tokens (`AGENCY_GHL_APP_TOKEN`) to manage SaaS enablement and rebilling for sub-accounts.

## 🔐 Security Implementation
- **Webhook Verification:** All incoming GHL webhooks are verified using the **Ed25519** public key (`X-GHL-Signature`).
- **Idempotency:** Processed webhook IDs are stored in `processed_webhooks` to prevent duplicate processing.
- **Token Management:** Automatic OAuth token refresh mechanism implemented in `lib/ghl.ts`.

## 📈 Database Schema Key Areas
- `installations`: Stores GHL OAuth tokens and location mapping.
- `billing_invoices`: Internal tracking of agency SaaS billing.
- `merchant_applications`: Queue for onboarding new merchants.
- `payments`: Master log of all PayFast transactions.
- `processed_webhooks`: Audit log for webhook delivery.

## 🛠 Environment Configuration
Key variables required for operation:
- `GHL_CLIENT_ID` / `GHL_CLIENT_SECRET`: OAuth credentials.
- `GHL_APP_TOKEN` / `AGENCY_GHL_APP_TOKEN`: Marketplace API tokens.
- `NEXT_PUBLIC_APP_URL`: Base URL for webhook and checkout callbacks.
- `NEXT_PUBLIC_ADMIN_PASSWORD`: Access key for the admin panel.
