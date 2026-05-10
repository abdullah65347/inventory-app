import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavSection } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { initials } from '../../core/utils/role.util';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './user-layout.component.html',
  styleUrls: ['./user-layout.component.css']
})
export class UserLayoutComponent {
  auth = inject(AuthService);
  sidebarOpen = signal(false);

  navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', icon: 'bi-grid-1x2-fill', route: '/user/dashboard' }]
    },
    {
      title: 'Shopping',
      items: [
        { label: 'Products', icon: 'bi-shop-window',  route: '/user/products' },
        { label: 'My Orders',icon: 'bi-bag-fill',     route: '/user/orders' },
      ]
    }
  ];

  get userInitials(): string { return initials(this.auth.currentUser()?.name ?? 'U'); }
}
