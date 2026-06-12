import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../admin/services/supplier.service';
import { SupplierOrderService } from '../../services/supplier-order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PurchaseResponse } from '../../../common/models/purchase.model';
import { statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { PurchaseService } from 'src/app/features/admin/services/purchase.service';

@Component({
  selector: 'app-supplier-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './supplier-orders.component.html',
  styleUrls: ['./supplier-orders.component.css'],
  animations: [fadeIn]
})
export class SupplierOrdersComponent implements OnInit {
  auth = inject(AuthService);
  supplierSvc = inject(SupplierService);
  orderSvc = inject(SupplierOrderService);
  private svc = inject(PurchaseService);
  toast = inject(ToastService);

  orders = signal<PurchaseResponse[]>([]);
  filtered = signal<PurchaseResponse[]>([]);
  loading = signal(true);
  statusFilter = 'all';
  detailItem = signal<PurchaseResponse | null>(null);
  statusBadge = statusBadge;

  ngOnInit(): void {
    this.load();
  }

  applyFilter(): void {
    this.filtered.set(
      this.statusFilter === 'all'
        ? this.orders()
        : this.orders().filter(o => o.status === this.statusFilter)
    );
  }

  deliver(o: PurchaseResponse): void {
    if (!confirm('Mark this order as delivered?')) return;
    this.orderSvc.deliver(o.id).subscribe({
      next: () => { this.toast.success('Marked as delivered'); this.ngOnInit(); },
      error: err => this.toast.error(err?.error?.message ?? 'Failed')
    });
  }
  cancel(p: PurchaseResponse): void {
    if (!confirm('Cancel this order?')) return;
    this.svc.cancel(p.id).subscribe({
      next: () => { this.toast.success('Cancelled'); this.load(); },
      error: () => this.toast.error('Failed')
    });
  }
  load(): void {
    this.loading.set(true);
    const user = this.auth.currentUser();
    if (!user) return;
    this.supplierSvc.getByUser(user.id).subscribe({
      next: s => {
        this.orderSvc.getBySupplier(s.id).subscribe({
          next: o => { this.orders.set(o); this.applyFilter(); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  get totalOrders(): number { return this.orders().length; }
  get pendingOrders(): number { return this.orders().filter(o => o.status === 'PENDING').length; }
  get deliveredOrders(): number { return this.orders().filter(o => o.status === 'DELIVERED').length; }
  get confirmedOrders(): number { return this.orders().filter(o => o.status === 'CONFIRMED').length; }

}
