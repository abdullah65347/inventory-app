import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent, NavSection } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { initials } from '../../core/utils/role.util';
import { ChatbotComponent } from 'src/app/shared/components/chatbot/chatbot.component';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ChatbotComponent],
  template: `
    <div class="layout-wrapper">
      <aside class="sidebar" [class.sidebar-open]="sidebarOpen()">
        <app-sidebar [sections]="navSections" roleLabel="Staff"
          profileRoute="/staff/profile"
          accentGradient="linear-gradient(135deg,#10b981,#06b6d4)">
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
              <p class="topbar-title">Staff Portal</p>
              <p class="topbar-sub">Billing & sales</p>
            </div>
          </div>
          <div class="topbar-actions">
            <button class="topbar-btn"><i class="bi bi-bell"></i></button>
            <div class="avatar" style="background:linear-gradient(135deg,#10b981,#06b6d4)">{{ userInitials }}</div>
          </div>
        </header>
        <div class="page-content"><router-outlet /></div>
      </main>
    </div>
    <app-chatbot />
  `
})
export class StaffLayoutComponent {
  auth = inject(AuthService);
  sidebarOpen = signal(false);

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