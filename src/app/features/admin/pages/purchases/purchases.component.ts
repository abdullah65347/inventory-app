import { Component, OnInit, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-admin-purchases',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
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
  suppliers = signal<SupplierResponse[]>([]);
  supProducts = signal<SupplierProductResponse[]>([]);
  loading = signal(true);
  showCreate = signal(false);
  detailItem = signal<PurchaseResponse | null>(null);

  selectedSupplierId = 0;
  selectedProductId = 0;
  selectedQty = 1;
  orderItems: { productId: number; quantity: number }[] = [];

  statusBadge = statusBadge;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: p => { this.purchases.set(p); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.supplierSvc.getAll().subscribe({ next: s => this.suppliers.set(s) });
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