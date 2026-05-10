# 📦 InvenTrack — Inventory Management System

A full-featured **Angular 17 Standalone** frontend with a clean, modular architecture mapping exactly to the backend REST API.

---

## 🚀 Quick Start

```bash
# 1. Install Angular CLI 17
npm install -g @angular/cli@17

# 2. Install dependencies
npm install

# 3. Run dev server
ng serve

# 4. Open browser
# http://localhost:4200
```

> Backend must be running at `http://localhost:8080`

---

## 👥 Demo Credentials

| Role     | Email                | Password    |
|----------|----------------------|-------------|
| Admin    | admin@ims.com        | admin123    |
| Supplier | supplier@ims.com     | supplier123 |
| User     | user@ims.com         | user123     |

---

## 🗂️ Architecture

```
src/app/
├── core/                    # Global singletons
│   ├── config/              # api.config.ts (base URL)
│   ├── services/            # auth, token, api (HTTP wrapper)
│   ├── guards/              # auth.guard, role.guard
│   ├── interceptors/        # auth (JWT attach), error (global)
│   ├── models/              # auth.model, user.model
│   └── utils/               # role.util (helpers)
│
├── shared/                  # Reusable UI
│   ├── components/
│   │   ├── sidebar/         # Shared sidebar with profile dropdown
│   │   ├── loader/          # Spinner component
│   │   └── navbar/          # Toast service + container
│   ├── animations/          # fade, slide, scale
│   └── constants/           # roles, api-endpoints
│
├── layouts/                 # Role-based shells
│   ├── auth/                # Plain layout for login/register
│   ├── admin/               # Admin shell (sidebar + topbar)
│   ├── supplier/            # Supplier shell
│   └── user/                # Customer shell
│
└── features/                # Business modules
    ├── auth/                # Login, Register pages + service
    ├── admin/               # Dashboard, Users, Suppliers,
    │                        # Categories, Products, Purchases,
    │                        # Inventory, Transactions, Sales
    ├── supplier/            # Dashboard, Products, Stock, Orders
    ├── user/                # Dashboard, Products (cart), Orders
    └── common/models/       # All shared DTOs
```

---

## ✨ Key Features

### Auth
- Animated background with floating blobs and particles
- Form validation with inline error messages
- Password strength indicator on register
- Confirm password field with match indicator
- Show/hide password toggle
- Demo credentials quick-fill panel

### All Roles — Sidebar
- Profile card with initials avatar
- Click profile → dropdown shows username, email, View Profile, Sign Out

### Admin Portal
- Dashboard: 6 KPI stat cards, Bar/Pie/Line charts (Chart.js), recent sales + low stock tables
- Full CRUD: Users, Suppliers, Categories, Products
- Purchase order builder (multi-item, supplier-scoped)
- Deliver/Cancel purchase flow → inventory auto-updated
- Sales lifecycle: PENDING → PAID → DELIVERED
- Inventory with stock health bars and reorder level config
- Transaction log (ADMIN_PURCHASE / ADMIN_SALE)

### Supplier Portal
- Dashboard with charts (stock distribution pie, stock trend line)
- Product management (create, add stock, update price)
- Stock overview with visual progress bars
- Read-only purchase order view

### Customer Portal
- Product grid with cart functionality
- Cart modal with quantity controls
- Order history with expandable rows and progress stepper

---

## 🔧 Configuration

Edit `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

---

## 🏗️ Build

```bash
ng build --configuration production
# Output → dist/inventory-management-system/
```
