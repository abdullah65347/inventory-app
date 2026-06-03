import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent, NavSection } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { initials } from '../../core/utils/role.util';
import { ChatbotComponent } from 'src/app/shared/components/chatbot/chatbot.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LowStockSidebarComponent } from 'src/app/shared/components/low-stock-sidebar/low-stock-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, SidebarComponent, ChatbotComponent, ThemeToggleComponent, LowStockSidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  sidebarOpen = signal(false);
  collapsed = signal(false);
  toggleSidebar() { this.collapsed.update(v => !v); }

  navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', icon: 'bi-grid-1x2-fill', route: '/admin/dashboard' }
      ]
    },
    {
      title: 'Management',
      items: [
        { label: 'Users', icon: 'bi-people-fill', route: '/admin/users' },
        { label: 'Managers', icon: 'bi-person-badge-fill', route: '/admin/managers' },
        { label: 'Staff', icon: 'bi-person-lines-fill', route: '/admin/staff' },
        { label: 'Suppliers', icon: 'bi-truck', route: '/admin/suppliers' },
        { label: 'Categories', icon: 'bi-tags-fill', route: '/admin/categories' },
        { label: 'Products', icon: 'bi-box-seam-fill', route: '/admin/products' },
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Purchases', icon: 'bi-cart-plus-fill', route: '/admin/purchases' },
        { label: 'Sales', icon: 'bi-receipt-cutoff', route: '/admin/sales' },
        { label: 'Inventory', icon: 'bi-archive-fill', route: '/admin/inventory' },
        { label: 'Transactions', icon: 'bi-arrow-left-right', route: '/admin/transactions' },
      ]
    }
  ];
  onMenuClick(): void {
    // On mobile (≤1024px) toggle the overlay; on desktop toggle collapse
    if (window.innerWidth <= 1024) {
      this.sidebarOpen.update(v => !v);
    } else {
      this.collapsed.update(v => !v);
    }
  }
  get userInitials(): string { return initials(this.auth.currentUser()?.name ?? 'A'); }
}