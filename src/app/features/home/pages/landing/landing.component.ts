import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';
import { AuthModalComponent } from 'src/app/features/auth/pages/auth-modal/auth-modal.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, ThemeToggleComponent, AuthModalComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  auth = inject(AuthService);
  router = inject(Router);

  // Active Role Preview Tab
  activeTab = signal<'admin' | 'manager' | 'supplier' | 'staff'>('admin');

  // Interactive Live Restock Simulator Signals
  macbookStock = signal(42);
  iphoneStock = signal(8);
  restockedCount = signal(0);
  showAlert = signal(false);
  // Add these to LandingComponent class:
  showModal = signal(false);
  modalMode = signal<'login' | 'register'>('login');

  setTab(tab: 'admin' | 'manager' | 'supplier' | 'staff'): void {
    this.activeTab.set(tab);
  }

  simulateRestock(): void {
    this.macbookStock.update(s => Math.min(s + 15, 100));
    this.iphoneStock.update(s => Math.min(s + 20, 120));
    this.restockedCount.update(c => c + 1);
    this.showAlert.set(true);
    setTimeout(() => this.showAlert.set(false), 3000);
  }

  openModal(mode: 'login' | 'register'): void {
    this.modalMode.set(mode);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  resetSimulator(): void {
    this.macbookStock.set(42);
    this.iphoneStock.set(8);
    this.restockedCount.set(0);
  }

  goToDashboard(): void {
    if (this.auth.isLoggedIn()) {
      this.auth.navigateByRole();
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
