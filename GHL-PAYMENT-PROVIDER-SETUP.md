# CRM Custom Payment Provider Setup Guide
## Connecting GoPayFast to CRM Native Payments

---

## Step 1 — CRM Marketplace App Settings

Apne CRM marketplace app mein jao aur **Advanced Settings** section mein ye fill karo:

### Payment Provider Section:

| Field | Value |
|---|---|
| **Provider Name** | GoPayFast by 10x Digital Ventures |
| **Description** | Accept GoPayFast payments in CRM invoices, payment links, and order forms |
| **Logo URL** | https://payfast.10xdigitalventures.com/logo.png |
| **queryUrl** | https://payfast.10xdigitalventures.com/api/ghl/query |
| **paymentsUrl** | https://payfast.10xdigitalventures.com/ghl-checkout |
| **Payment Types** | ✅ OneTime ✅ Recurring |

### Custom Page (Config Iframe):

| Field | Value |
|---|---|
| **Custom Page URL** | https://payfast.10xdigitalventures.com/ghl-config |

---

## Step 2 — CRM App Scopes Required

Make sure these scopes are selected in your CRM app:
- payments.write
- payments.readonly
- contacts.write
- contacts.readonly
- opportunities.write
- locations.readonly

---

## Step 3 — How It Works After Setup

```
1. User installs app from CRM Marketplace
        ↓
2. OAuth flow runs → tokens stored in our DB
        ↓
3. User goes to CRM → Payments → Integrations
   → Sees "GoPayFast by 10x Digital Ventures"
   → Clicks "Manage" → our /ghl-config page loads in iframe
   → User enters Store ID + Store Password → Save
        ↓
4. User creates Invoice in CRM → selects GoPayFast as payment method
   → CRM loads our `/ghl-checkout` page in iframe
   → Customer fills name/email → clicks Pay
   → Redirected to GoPayFast
        ↓
5. Customer pays on GoPayFast
        ↓
6. GoPayFast sends ITN to /api/payfast/itn
        ↓
7. Our app sends `payment.captured` webhook to CRM:
   POST https://backend.leadconnectorhq.com/payments/custom-provider/webhook
   { event: "payment.captured", chargeId, ghlTransactionId, amount, ... }
        ↓
8. CRM marks Invoice as PAID ✅
   CRM automations fire ✅
   Contact tags update ✅
```

---

## Step 4 — CRM Marketplace App Profile Settings

In your app profile, make sure:
- **Category:** Third Party Provider + Whitelabel Payment Provider
- **App Type:** Public
- **Listing Type:** White-label (Recommended)

---

## Step 5 — Test Flow

1. Install your app on a test CRM sub-account
2. Go to Payments → Integrations → GoPayFast → Manage
3. Enter GoPayFast sandbox credentials
4. Create a test invoice in CRM
5. Select GoPayFast as payment method
6. Complete payment in GoPayFast sandbox
7. Verify invoice shows as "Paid" in CRM

---

## Webhook URLs Summary

| Purpose | URL |
|---|---|
| GoPayFast ITN (GoPayFast → Our App) | https://payfast.10xdigitalventures.com/api/payfast/itn |
| CRM Query (CRM → Our App) | https://payfast.10xdigitalventures.com/api/ghl/query |
| CRM Notify (Our App → CRM) | https://backend.leadconnectorhq.com/payments/custom-provider/webhook |
| Checkout Iframe | https://payfast.10xdigitalventures.com/ghl-checkout |
| Config Iframe | https://payfast.10xdigitalventures.com/ghl-config |
