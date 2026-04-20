# Application Sitemap & URL Map

Comprehensive list of all accessible pages and their purposes.

## 👤 User / Merchant Dashboard
Accessible after login.

| URL | Purpose | Access |
| :--- | :--- | :--- |
| `/dashboard` | Main overview of payments and stats | User |
| `/settings` | Account & PayFast credential configuration | User |
| `/payments` | View and manage all transactions | User |
| `/payments/new` | Create a new payment link | User |
| `/payment-links` | List of active payment links | User |
| `/payment-links/new` | Setup a new payment link | User |
| `/payment-schedules` | Manage installment plans | User |
| `/payment-schedules/new` | Create a new installment plan | User |
| `/invoices` | List of created invoices | User |
| `/invoices/new` | Generate a new invoice | User |
| `/order-forms` | Management of order form links | User |
| `/order-forms/new` | Create a new order form | User |
| `/products` | Product catalog management | User |
| `/products/new` | Add a new product/service | User |
| `/coupons` | Discount code management | User |
| `/subscriptions` | Subscription tracking | User |
| `/text2pay` | Create and track SMS payment requests | User |

## 🏢 Agency Console
Dedicated portal for agency owners.

| URL | Purpose | Access |
| :--- | :--- | :--- |
| `/agency` | Agency Billing Console (Summary, Wallet, SaaS) | Agency |
| `/agency/install` | Agency-specific GHL onboarding | Public/Agency |
| `/agency/login` | Dedicated login for agency accounts | Public |

## 🌍 Public & External Pages
Accessible without login.

| URL | Purpose | Access |
| :--- | :--- | :--- |
| `/apply` | Merchant application form | Public |
| `/pay/[token]` | Secure checkout page for payment links | Public |
| `/pay/success` | Payment confirmation landing page | Public |
| `/invoice/[token]` | Public view of a generated invoice | Public |
| `/install` | Standard GHL app installation flow | Public |
| `/login` | User login portal | Public |

## 🔌 GHL Integration Pages
Loaded as iFrames or via API.

| URL | Purpose | Access |
| :--- | :--- | :--- |
| `/ghl-checkout` | Native GHL checkout iFrame | GHL |
| `/ghl-checkout/success` | GHL-specific payment success page | GHL |
| `/ghl-config` | Provider configuration page in GHL | GHL |
| `/oauth/callback` | OAuth token exchange endpoint | GHL |

## 🛠 Admin Panel
Internal management area.

| URL | Purpose | Access |
| :--- | :--- | :--- |
| `/admin` | Merchant application review and approval | Admin |
