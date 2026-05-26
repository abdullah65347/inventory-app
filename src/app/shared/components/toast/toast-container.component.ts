import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div class="toast-item {{ toast.type }}" (click)="toastSvc.remove(toast.id)" style="cursor:pointer">
          <i class="bi {{ toast.icon }}" [style.color]="iconColor(toast.type)"></i>
          <span>{{ toast.message }}</span>
          <button style="margin-left:auto;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;line-height:1"
            (click)="toastSvc.remove(toast.id)">×</button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast-container.component.scss']
})
export class ToastContainerComponent {
  toastSvc = inject(ToastService);

  iconColor(type: string): string {
    const m: Record<string, string> = {
      success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#4f46e5'
    };
    return m[type] ?? '#4f46e5';
  }
}
