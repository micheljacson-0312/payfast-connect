# GoPayFast Connect 🚀

GoPayFast Connect is a professional payment orchestration and aggregation platform designed to bridge **GoPayFast** with **CRM systems** (specifically GoHighLevel/GHL). It empowers agencies to onboard merchants, manage sub-account payment tools, and handle agency-level SaaS billing in one unified, mobile-responsive portal.

## 🌟 Core Features

### 1. Agency Billing Console
A comprehensive control center for agency owners to manage their business operations:
- **Billing Summary:** Real-time tracking of MRR, active clients, and suspension status.
- **SaaS Management:** Integrated tools to enable SaaS for locations and manage rebilling configurations.
- **Wallet Management:** Track agency internal balances, top-ups, and automated deductions.
- **Payment Instruments:** Securely store and manage agency-level payment methods.
- **Billing Guard:** A safety mechanism that ensures agency-level PayFast credentials are set before allowing billing actions.

### 2. Merchant Onboarding & Approval
- **Public Application Portal:** A streamlined form for merchants to submit business, banking, and KYC details.
- **Admin Review Panel:** A centralized dashboard for admins to vet applications, assign Store IDs, and approve/reject merchants.
- **Automated CRM Provisioning:** Upon approval, merchant credentials are automatically injected into the CRM installation, enabling immediate payment capabilities.

### 3. Native GHL Payment Integration
- **Custom Payment Provider:** Fully integrated into GHL's native payment ecosystem (visible in `Payments > Integrations`).
- **Native Checkout:** Custom iFrame checkout page that handles GHL's `payment_initiate_props` and returns standard success/error responses.
- **Native Invoices & Products:** Full synchronization with GHL's native Invoice and Product APIs.
- **Order Management:** Automatic marking of GHL Orders as "Paid" upon payment confirmation.
- **Text2Pay:** Native SMS payment requests that create temporary GHL products and send payment links.

### 4. Advanced Payment Orchestration
- **Installment Plans:** Create flexible multi-step payment schedules with individual tracking for each installment.
- **Dynamic Coupons:** Manage discount codes applicable to payment links and order forms.
- **Product Catalog:** Centralized management of services and products for rapid checkout configuration.

## 📱 Mobile-First Experience
Designed for on-the-go management:
- **Responsive Layouts:** Fluid grids that adapt to any screen size.
- **Adaptive Navigation:** Sidebar transforms into a toggleable slide-over menu on mobile.
- **Optimized UI:** Touch-friendly controls and compact spacing for maximum productivity on smartphones.

## 🛠 Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Modern CSS Variables + Responsive Grid System
- **Database:** MySQL (via `mysql2`)
- **Authentication:** JWT (via `jose`)
- **GHL Integration:** OAuth 2.0 + Native Marketplace API
- **Hosting:** Hostinger Node.js (Passenger)

## 🚀 Getting Started
Refer to the [Deployment Guide](DEPLOY.md) for detailed setup instructions and environment configuration.
