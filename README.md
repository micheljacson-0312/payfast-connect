# GoPayFast Connect 🚀

GoPayFast Connect is a specialized payment orchestration and aggregation platform designed to bridge **GoPayFast** with **CRM systems** (like HighLevel/GHL). It allows agencies to onboard merchants, manage sub-account payment tools, and handle agency-level SaaS billing in one unified portal.

## 🌟 Core Features

### 1. Agency Billing Console
A professional control center for agencies to manage their overall business:
- **Billing Summary:** Real-time MRR, active clients, and suspension tracking.
- **Wallet Management:** Track agency balances, top-ups, and deductions.
- **Payment Instruments:** Securely save and manage agency payment methods.
- **Billing Guard:** Integrated safety check that locks billing actions until agency-level PayFast credentials are configured.

### 2. Merchant Onboarding & Management
- **Application Portal:** Public form for merchants to submit business, banking, and KYC details.
- **Admin Review Panel:** Centralized area for admins to review applications, assign Store IDs, and approve/reject merchants.
- **Automated Provisioning:** Once approved, credentials are automatically injected into the CRM installation.

### 3. CRM Payment Integration
- **Custom Payment Provider:** Integrates directly into CRM native payments (Invoices, Payment Links, Order Forms).
- **OAuth Flow:** Seamless "one-click" installation for CRM sub-accounts.
- **Automated Sync:** Payment status (Captured/Failed) is synced back to CRM via webhooks, triggering automations and updating contact tags.

### 4. Advanced Payment Tools
- **Installment Plans:** Create multi-step payment schedules with individual payment links for each installment.
- **Text2Pay:** Generate shareable payment requests for WhatsApp or SMS.
- **Dynamic Coupons:** Create and manage discount codes for payment links and order forms.
- **Product Catalog:** Manage a centralized list of services and products for easy selection during checkout.

## 📱 Mobile First Design
The application is fully optimized for mobile devices, featuring:
- **Responsive Layouts:** All dashboards and forms utilize fluid grids.
- **Mobile-Optimized Navigation:** Slide-over sidebar for effortless navigation on small screens.
- **Touch-Friendly UI:** Compact controls and optimized spacing for mobile productivity.

## 🛠 Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Variables + Custom Responsive Helpers
- **Database:** MySQL (via `mysql2`)
- **Authentication:** JWT via `jose`
- **Hosting:** Hostinger Node.js (Passenger)

## 🚀 Quick Start
Refer to the [Deployment Guide](DEPLOY.md) for detailed setup instructions on Hostinger.
