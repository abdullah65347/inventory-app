import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ROLES } from './shared/constants/roles.constant';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // AUTH
  {
    path: 'auth',
    canActivate: [publicGuard],
    loadComponent: () => import('./layouts/auth/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // ADMIN
  {
    path: 'admin',
    canActivate: [roleGuard],
    data: { role: ROLES.ADMIN },
    loadComponent: () => import('./layouts/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/pages/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/pages/users/users.component').then(m => m.UsersComponent) },
      { path: 'managers', loadComponent: () => import('./features/admin/pages/managers/managers.component').then(m => m.ManagersComponent) },
      { path: 'staff', loadComponent: () => import('./features/admin/pages/staff/staff.component').then(m => m.StaffComponent) },
      { path: 'suppliers', loadComponent: () => import('./features/admin/pages/suppliers/suppliers.component').then(m => m.SuppliersComponent) },
      { path: 'categories', loadComponent: () => import('./features/admin/pages/categories/categories.component').then(m => m.CategoriesComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/pages/products/products.component').then(m => m.AdminProductsComponent) },
      { path: 'purchases', loadComponent: () => import('./features/admin/pages/purchases/purchases.component').then(m => m.PurchasesComponent) },
      { path: 'sales', loadComponent: () => import('./features/admin/pages/sales/sales.component').then(m => m.AdminSalesComponent) },
      { path: 'inventory', loadComponent: () => import('./features/admin/pages/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'transactions', loadComponent: () => import('./features/admin/pages/transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'profile', loadComponent: () => import('./features/common/pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // SUPPLIER
  {
    path: 'supplier',
    canActivate: [roleGuard],
    data: { role: ROLES.SUPPLIER },
    loadComponent: () => import('./layouts/supplier/supplier-layout.component').then(m => m.SupplierLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/supplier/pages/dashboard/supplier-dashboard.component').then(m => m.SupplierDashboardComponent) },
      { path: 'products', loadComponent: () => import('./features/supplier/pages/products/supplier-products.component').then(m => m.SupplierProductsComponent) },
      { path: 'stock', loadComponent: () => import('./features/supplier/pages/stock/supplier-stock.component').then(m => m.SupplierStockComponent) },
      { path: 'orders', loadComponent: () => import('./features/supplier/pages/orders/supplier-orders.component').then(m => m.SupplierOrdersComponent) },
      { path: 'profile', loadComponent: () => import('./features/common/pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // MANAGER
  {
    path: 'manager',
    canActivate: [roleGuard],
    data: { role: ROLES.MANAGER },
    loadComponent: () => import('./layouts/manager/managers-layout.component').then(m => m.ManagerLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/manager/pages/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent) },
      { path: 'purchases', loadComponent: () => import('./features/manager/pages/purchases/manager-purchases.component').then(m => m.ManagerPurchasesComponent) },
      { path: 'staff', loadComponent: () => import('./features/manager/pages/staff/manager-staff.component').then(m => m.ManagerStaffComponent) },
      { path: 'sales', loadComponent: () => import('./features/manager/pages/sales/manager-sales.component').then(m => m.ManagerSalesComponent) },
      { path: 'profile', loadComponent: () => import('./features/common/pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // STAFF
  {
    path: 'staff',
    canActivate: [roleGuard],
    data: { role: ROLES.STAFF },
    loadComponent: () => import('./layouts/staff/staff-layout.component').then(m => m.StaffLayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/staff/pages/dashboard/staff-dashboard.component').then(m => m.StaffDashboardComponent) },
      { path: 'sales', loadComponent: () => import('./features/staff/pages/sales/staff-sales.component').then(m => m.StaffSalesComponent) },
      { path: 'history', loadComponent: () => import('./features/staff/pages/history/staff-history.component').then(m => m.StaffHistoryComponent) },
      { path: 'profile', loadComponent: () => import('./features/common/pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '/auth/login' }
];