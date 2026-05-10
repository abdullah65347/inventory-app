import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SaleResponse } from '../../../common/models/sale.model';
import { statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './user-orders.component.html',
  styleUrls: ['./user-orders.component.css'],
  animations: [fadeIn]
})
export class UserOrdersComponent implements OnInit {
  auth    = inject(AuthService);
  saleSvc = inject(SaleService);

  orders       = signal<SaleResponse[]>([]);
  filtered     = signal<SaleResponse[]>([]);
  loading      = signal(true);
  statusFilter = 'all';
  expanded     = signal<number | null>(null);
  statusBadge  = statusBadge;

  steps = [
    { key: 'PENDING',   label: 'Ordered',   icon: 'bi-bag-check' },
    { key: 'PAID',      label: 'Paid',       icon: 'bi-credit-card' },
    { key: 'DELIVERED', label: 'Delivered',  icon: 'bi-house-check' },
  ];

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.saleSvc.getByUser(user.id).subscribe({
      next: sales => {
        this.orders.set([...sales].reverse());
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilter(): void {
    this.filtered.set(
      this.statusFilter === 'all'
        ? this.orders()
        : this.orders().filter(o => o.status === this.statusFilter)
    );
  }

  toggleExpand(id: number): void {
    this.expanded.update(v => v === id ? null : id);
  }

  isStepDone(status: string, stepKey: string): boolean {
    const order = ['PENDING', 'PAID', 'DELIVERED'];
    return order.indexOf(status) >= order.indexOf(stepKey);
  }

  progressWidth(status: string): string {
    const m: Record<string, string> = { PENDING: '0%', PAID: '50%', DELIVERED: '100%' };
    return m[status] ?? '0%';
  }
}
