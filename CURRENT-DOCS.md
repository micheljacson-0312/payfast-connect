# GoPayFast Connect

Current application documentation for the live codebase.

## Overview

This app is a Next.js 15 payment system connected to GoPayFast and a CRM custom payment provider flow.

Core areas implemented:

- OAuth install and session handling
- GoPayFast settings and webhook flow
- Payments, invoices, payment links, text2pay, coupons, products, order forms
- Merchant apply form and admin review panel
- Installment plans and installment payment links

## Main Routes

### Internal App Routes

- `/dashboard`
- `/settings`
- `/payments`
- `/payments/new`
- `/payment-links`
- `/payment-links/new`
- `/payment-schedules`
- `/payment-schedules/new`
- `/invoices`
- `/invoices/new`
- `/order-forms`
- `/order-forms/new`
- `/products`
- `/products/new`
- `/coupons`
- `/subscriptions`
- `/text2pay`

### Public Routes

- `/install`
- `/pay/[token]`
- `/pay/success`
- `/invoice/[token]`
- `/apply`

### CRM Integration Routes

- `/ghl-checkout`
- `/ghl-checkout/success`
- `/ghl-config`
- `/oauth/callback`

### Admin Route

- `/admin`

## Main API Routes

- `/api/settings`
- `/api/products`
- `/api/invoices`
- `/api/payment-links`
- `/api/payment-schedules`
- `/api/order-forms`
- `/api/text2pay`
- `/api/coupons`
- `/api/coupons/validate`
- `/api/pay/create`
- `/api/payfast/create`
- `/api/payfast/itn`
- `/api/ghl/pay`
- `/api/ghl/query`
- `/api/ghl/notify`
- `/api/ghl/config`
- `/api/apply`
- `/api/admin/applications`
- `/api/admin/applications/[id]`
- `/api/auth/logout`

## GoPayFast Notes

- Live URL: `https://gopayfast.com/pg/pay`
- Sandbox URL: `https://sandbox.gopayfast.com/pg/pay`
- Visible labels use `Store ID` and `Store Password`
- Database still stores these in `merchant_id` and `merchant_key` for compatibility

## Merchant Apply Flow

Public users can submit merchant applications from `/apply`.

Stored in:

- `merchant_applications`

Admin users can review applications in `/admin` and save:

- status
- Store ID
- Store Password
- passphrase
- notes

If a CRM location ID exists, admin-saved credentials are also injected into `installations`.

## Installment Flow

Users can create installment plans from `/payment-schedules/new`.

Saved in:

- `payment_schedules`
- `schedule_installments`

Each installment gets its own public `/pay/[token]` link.

When GoPayFast confirms payment through ITN:

- installment status becomes `paid`
- `paid_count` updates
- `amount_paid` updates
- schedule becomes `completed` once all installments are paid

## Remaining Real-World Tasks

- Test OAuth install on a real CRM test location
- Test GoPayFast sandbox payment end-to-end
- Verify ITN callbacks on deployed environment
- Harden `/admin` auth beyond the current simple password gate

## Environment Variables

- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_SHARED_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SESSION_SECRET`
- `NEXT_PUBLIC_ADMIN_PASSWORD`
