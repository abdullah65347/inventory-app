import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../services/purchase.service';
import { SupplierService } from '../../services/supplier.service';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PurchaseResponse, PurchaseRequest } from '../../../common/models/purchase.model';
import { SupplierResponse } from '../../../common/models/supplier.model';
import { SupplierProductResponse } from '../../../common/models/product.model';
import { statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';

import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';
import { StatStripComponent, StatStripItem } from 'src/app/shared/components/stats-strip/stat-strip.component';

@Component({
  selector: 'app-admin-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, StatStripComponent, AppTableComponent, PaginatorComponent],
  templateUrl: './purchases.component.html',
  styleUrls: ['./purchases.component.css'],
  animations: [fadeIn]
})
export class PurchasesComponent implements OnInit {
  private svc = inject(PurchaseService);
  private supplierSvc = inject(SupplierService);
  private productSvc = inject(ProductService);
  private toast = inject(ToastService);

  purchases = signal<PurchaseResponse[]>([]);
  filtered = signal<PurchaseResponse[]>([]);
  suppliers = signal<SupplierResponse[]>([]);
  supProducts = signal<SupplierProductResponse[]>([]);
  loading = signal(true);
  showCreate = signal(false);
  detailItem = signal<PurchaseResponse | null>(null);

  page = signal(1);
  pageSize = signal(10);
  search = '';
  selectedStatus = '';
  selectedSort = '';

  statusFilterOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELED', label: 'Cancelled' },
  ];

  sortOptions = [
    { value: 'date_desc', label: 'Date (Newest)' },
    { value: 'date_asc', label: 'Date (Oldest)' },
    { value: 'amount_desc', label: 'Amount (High to Low)' },
    { value: 'amount_asc', label: 'Amount (Low to High)' },
  ];

  dashboardStats = computed<StatStripItem[]>(() => [
    { icon: 'bi-cart-fill', value: this.purchases().length, label: 'Total Orders', iconClass: 'icon-primary', format: 'number' },
    { icon: 'bi-hourglass-split', value: this.pendingCount, label: 'Pending', iconClass: 'icon-warning', format: 'number' },
    { icon: 'bi-truck', value: this.deliveredCount, label: 'Delivered', iconClass: 'icon-accent', format: 'number' },
    { icon: 'bi-check-circle-fill', value: this.confirmedCount, label: 'Confirmed', iconClass: 'icon-success', format: 'number' },
    { icon: 'bi-x-circle-fill', value: this.cancelledCount, label: 'Cancelled', iconClass: 'icon-danger', format: 'number' }
  ]);

  selectedSupplierId = 0;
  selectedProductId = 0;
  selectedQty = 1;
  orderItems: { productId: number; quantity: number }[] = [];

  statusBadge = statusBadge;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: p => { this.purchases.set(p); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.supplierSvc.getAll().subscribe({ next: s => this.suppliers.set(s) });
  }

  applyFilter(): void {
    const s = this.search.toLowerCase();
    let list = this.purchases().filter(p =>
      (p.supplierName || '').toLowerCase().includes(s) || p.id.toString().includes(s)
    );

    if (this.selectedStatus) {
      list = list.filter(p => p.status === this.selectedStatus);
    }

    if (this.selectedSort) {
      list = [...list].sort((a, b) => {
        switch (this.selectedSort) {
          case 'date_desc': return new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime();
          case 'date_asc': return new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime();
          case 'amount_desc': return b.totalAmount - a.totalAmount;
          case 'amount_asc': return a.totalAmount - b.totalAmount;
          default: return 0;
        }
      });
    }

    this.filtered.set(list);
    this.page.set(1);
  }

  get paged(): PageResult<PurchaseResponse> {
    return paginate(this.filtered(), this.page(), this.pageSize());
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  onSupplierChange(): void {
    if (!this.selectedSupplierId) return;
    this.productSvc.getBySupplier(this.selectedSupplierId).subscribe({ next: p => this.supProducts.set(p) });
    this.orderItems = [];
  }

  addItem(): void {
    if (!this.selectedProductId || this.selectedQty < 1) return;
    const ex = this.orderItems.find(i => i.productId === this.selectedProductId);
    if (ex) { ex.quantity += this.selectedQty; this.orderItems = [...this.orderItems]; }
    else { this.orderItems = [...this.orderItems, { productId: this.selectedProductId, quantity: this.selectedQty }]; }
    this.selectedProductId = 0; this.selectedQty = 1;
  }

  removeItem(id: number): void { this.orderItems = this.orderItems.filter(i => i.productId !== id); }
  productName(id: number): string { return this.supProducts().find(p => p.id === id)?.name ?? `#${id}`; }
  productPrice(id: number): number { return this.supProducts().find(p => p.id === id)?.supplierToAdminPrice ?? 0; }
  get orderTotal(): number { return this.orderItems.reduce((s, i) => s + i.quantity * this.productPrice(i.productId), 0); }

  createOrder(): void {
    const req: PurchaseRequest = { supplierId: this.selectedSupplierId, items: this.orderItems };
    this.svc.create(req).subscribe({
      next: () => { this.toast.success('Purchase order created'); this.closeCreate(); this.load(); },
      error: () => this.toast.error('Create failed')
    });
  }

  // Admin confirms delivery — triggers inventory STOCK_IN
  confirm(p: PurchaseResponse): void {
    if (!confirm('Confirm delivery? Inventory will be updated.')) return;
    this.svc.confirm(p.id).subscribe({
      next: () => { this.toast.success('Delivery confirmed — inventory updated'); this.load(); },
      error: err => this.toast.error(err?.error?.message ?? 'Confirm failed')
    });
  }

  cancel(p: PurchaseResponse): void {
    if (!confirm('Cancel this order?')) return;
    this.svc.cancel(p.id).subscribe({
      next: () => { this.toast.success('Cancelled'); this.load(); },
      error: () => this.toast.error('Failed')
    });
  }

  openCreate(): void { this.showCreate.set(true); this.selectedSupplierId = 0; this.orderItems = []; }
  closeCreate(): void { this.showCreate.set(false); this.supProducts.set([]); this.orderItems = []; }

  get pendingCount(): number {
    return this.purchases()
      .filter(p => p.status === 'PENDING')
      .length;
  }

  get confirmedCount(): number {
    return this.purchases()
      .filter(p => p.status === 'CONFIRMED')
      .length;
  }

  get deliveredCount(): number {
    return this.purchases()
      .filter(p => p.status === 'DELIVERED')
      .length;
  }

  get cancelledCount(): number {
    return this.purchases()
      .filter(p => p.status === 'CANCELED')
      .length;
  }

  get totalPurchaseAmount(): number {
    return this.purchases()
      .reduce((sum, p) => sum + p.totalAmount, 0);
  }

}