import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent, NavSection } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { initials } from '../../core/utils/role.util';
import { ChatbotComponent } from 'src/app/shared/components/chatbot/chatbot.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, SidebarComponent, ChatbotComponent, ThemeToggleComponent],
  templateUrl: './staff-layout.component.html',
  styleUrls: ['./staff-layout.component.css']
})
export class StaffLayoutComponent {
  auth = inject(AuthService);
  sidebarOpen = signal(false);
  collapsed = signal(false);
  toggleSidebar() { this.collapsed.update(v => !v); }

  onMenuClick(): void {
    if (window.innerWidth <= 1024) {
      this.sidebarOpen.update(v => !v);
    } else {
      this.collapsed.update(v => !v);
    }
  }

  navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', icon: 'bi-grid-1x2-fill', route: '/staff/dashboard' }]
    },
    {
      title: 'Billing',
      items: [
        { label: 'New Sale', icon: 'bi-cart-plus-fill', route: '/staff/sales' },
        { label: 'Sale History', icon: 'bi-clock-history', route: '/staff/history' },
      ]
    }
  ];

  get userInitials(): string { return initials(this.auth.currentUser()?.name ?? 'S'); }
}