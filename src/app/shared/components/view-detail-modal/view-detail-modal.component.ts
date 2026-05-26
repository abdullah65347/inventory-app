import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ViewField {
  key: string;
  label: string;
  width?: 'half' | 'full';
  type?: string;
}

@Component({
  selector: 'app-view-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-detail-modal.component.html',
  styleUrls: ['./view-detail-modal.component.css']
})
export class ViewDetailModalComponent {

  @Input() visible = false;

  @Input() title = '';

  @Input() data: any = {};

  @Input() fields: ViewField[] = [];

  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }

  formatValue(field: ViewField): string {

    const value = this.data?.[field.key];

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    // BOOLEAN STATUS

    if (field.key === 'active') {
      return value ? 'Active' : 'Inactive';
    }

    if (typeof value === 'string' && value.startsWith('ROLE_')) {
      return value.replace('ROLE_', '');
    }

    // DATE FORMAT

    if (
      field.key.toLowerCase().includes('date') ||
      field.key.toLowerCase().includes('at')
    ) {

      return new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

    }

    return value;
  }
}