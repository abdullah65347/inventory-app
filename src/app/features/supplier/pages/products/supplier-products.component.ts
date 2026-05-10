import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../../admin/services/supplier.service';
import { SupplierProductService } from '../../services/supplier-product.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SupplierProductResponse, ProductRequest } from '../../../common/models/product.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
  selector: 'app-supplier-products',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './supplier-products.component.html',
  styleUrls: ['./supplier-products.component.css'],
  animations: [fadeIn]
})
export class SupplierProductsComponent implements OnInit {
  auth         = inject(AuthService);
  supplierSvc  = inject(SupplierService);
  productSvc   = inject(SupplierProductService);
  toast        = inject(ToastService);

  products   = signal<SupplierProductResponse[]>([]);
  loading    = signal(true);
  supplierId = signal(0);

  showCreate   = signal(false);
  stockTarget  = signal<SupplierProductResponse | null>(null);
  priceTarget  = signal<SupplierProductResponse | null>(null);
  addQty       = 1;
  newPrice     = 0;

  createForm: ProductRequest = { name:'', description:'', supplierToAdminPrice:0, quantity:0, supplierId:0, sku:'' };

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.supplierSvc.getByUser(user.id).subscribe({
      next: s => { this.supplierId.set(s.id); this.load(); },
      error: () => this.loading.set(false)
    });
  }

  load(): void {
    this.loading.set(true);
    this.productSvc.getBySupplier(this.supplierId()).subscribe({
      next: p => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.createForm = { name:'', description:'', supplierToAdminPrice:0, quantity:0, supplierId: this.supplierId(), sku:'' };
    this.showCreate.set(true);
  }
  closeCreate(): void { this.showCreate.set(false); }

  create(): void {
    this.productSvc.create(this.createForm).subscribe({
      next: () => { this.toast.success('Product created'); this.closeCreate(); this.load(); },
      error: () => this.toast.error('Create failed')
    });
  }

  openAddStock(p: SupplierProductResponse): void { this.stockTarget.set(p); this.addQty = 1; }
  addStock(): void {
    const t = this.stockTarget();
    if (!t) return;
    this.productSvc.addStock(t.id, this.addQty).subscribe({
      next: () => { this.toast.success(`Added ${this.addQty} units`); this.stockTarget.set(null); this.load(); },
      error: () => this.toast.error('Failed to add stock')
    });
  }

  openEditPrice(p: SupplierProductResponse): void { this.priceTarget.set(p); this.newPrice = p.supplierToAdminPrice; }
  updatePrice(): void {
    const t = this.priceTarget();
    if (!t) return;
    this.productSvc.updatePrice(t.id, this.newPrice).subscribe({
      next: () => { this.toast.success('Price updated'); this.priceTarget.set(null); this.load(); },
      error: () => this.toast.error('Failed to update price')
    });
  }
}
