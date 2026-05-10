import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavSection } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { initials } from '../../core/utils/role.util';
import { ChatbotComponent } from 'src/app/shared/components/chatbot/chatbot.component';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ChatbotComponent],
  template: `
    <div class="layout-wrapper">
      <aside class="sidebar" [class.sidebar-open]="sidebarOpen()">
        <app-sidebar [sections]="navSections" roleLabel="Manager"
          profileRoute="/manager/profile"
          accentGradient="linear-gradient(135deg,#f59e0b,#ef4444)">
        </app-sidebar>
      </aside>
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      }
      <main class="main-content">
        <header class="topbar">
          <div class="topbar-left">
            <button class="topbar-btn d-lg-none" (click)="sidebarOpen.set(!sidebarOpen())">
              <i class="bi bi-list"></i>
            </button>
            <div>
              <p class="topbar-title">Manager Portal</p>
              <p class="topbar-sub">Team & operations overview</p>
            </div>
          </div>
          <div class="topbar-actions">
            <button class="topbar-btn"><i class="bi bi-bell"></i></button>
            <div class="avatar" style="background:linear-gradient(135deg,#f59e0b,#ef4444)">{{ userInitials }}</div>
          </div>
        </header>
        <div class="page-content"><router-outlet /></div>
      </main>
    </div>
    <app-chatbot />
  `
})
export class ManagerLayoutComponent {
  auth = inject(AuthService);
  sidebarOpen = signal(false);

  navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', icon: 'bi-grid-1x2-fill', route: '/manager/dashboard' }]
    },
    {
      title: 'Operations',
      items: [
        { label: 'Confirm Deliveries', icon: 'bi-truck', route: '/manager/purchases' },
        { label: 'My Staff', icon: 'bi-people-fill', route: '/manager/staff' },
        { label: 'Sales', icon: 'bi-receipt-cutoff', route: '/manager/sales' },
      ]
    }
  ];

  get userInitials(): string { return initials(this.auth.currentUser()?.name ?? 'M'); }
}