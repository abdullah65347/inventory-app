import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  private show(message: string, type: Toast['type'], icon: string): void {
    const id = ++this.counter;
    this.toasts.update(t => [...t, { id, message, type, icon }]);
    setTimeout(() => this.remove(id), 4000);
  }

  success(msg: string) { this.show(msg, 'success', 'bi-check-circle-fill'); }
  error(msg: string)   { this.show(msg, 'error',   'bi-x-circle-fill'); }
  warning(msg: string) { this.show(msg, 'warning',  'bi-exclamation-triangle-fill'); }
  info(msg: string)    { this.show(msg, 'info',     'bi-info-circle-fill'); }

  remove(id: number): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
