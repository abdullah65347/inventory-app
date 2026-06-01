import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="theme-btn" (click)="toggleTheme()" [attr.aria-label]="isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      <i class="bi" [ngClass]="isDark() ? 'bi-sun-fill text-warning rotate-in' : 'bi-moon-stars-fill text-primary-dark rotate-out'"></i>
    </button>
  `,
  styles: [`
    .theme-btn {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      outline: none;
    }

    .theme-btn:hover {
      background: var(--bg-body);
      border-color: var(--primary);
      transform: translateY(-1px) scale(1.05);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    }

    .theme-btn:active {
      transform: translateY(0) scale(0.95);
    }

    .theme-btn i {
      font-size: 15px;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.25s ease;
    }

    /* Modern rotating animations */
    .rotate-in {
      transform: rotate(360deg) scale(1.1);
    }

    .rotate-out {
      transform: rotate(0deg) scale(1);
    }
    
    .text-warning {
      color: #f59e0b !important;
    }
    
    .text-primary-dark {
      color: #19535f !important;
    }
  `]
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  isDark(): boolean {
    return this.themeService.isDark();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
