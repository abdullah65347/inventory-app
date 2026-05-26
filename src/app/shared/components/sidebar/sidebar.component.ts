import { Component, Input, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { initials } from '../../../core/utils/role.util';
import { ROLES } from '../../constants/roles.constant';
import { getAvatarGradient } from 'src/app/core/utils/avatar.util';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() sections: NavSection[] = [];
  @Input() accentGradient = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
  @Input() roleLabel = 'User';
  @Input() profileRoute = '/admin/profile';

  auth = inject(AuthService);
  router = inject(Router);
  profileOpen = signal(false);
  initials = initials;
  getAvatarGradient = getAvatarGradient;

  get userInitials(): string { return initials(this.auth.currentUser()?.name ?? 'U'); }
  get userName(): string { return this.auth.currentUser()?.name ?? ''; }
  get userEmail(): string { return this.auth.currentUser()?.email ?? ''; }

  toggleProfile(): void { this.profileOpen.update(v => !v); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.profile-card') && !target.closest('.profile-dropdown')) {
      this.profileOpen.set(false);
    }
  }

  viewProfile(): void {
    this.profileOpen.set(false);
    this.router.navigate([this.profileRoute]);
  }

  logout(): void {
    this.profileOpen.set(false);
    this.auth.logout();
  }
}