import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavSection } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { initials } from '../../core/utils/role.util';
import { ChatbotComponent } from 'src/app/shared/components/chatbot/chatbot.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ChatbotComponent],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  sidebarOpen = signal(false);

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

  get userInitials(): string { return initials(this.auth.currentUser()?.name ?? 'A'); }
}