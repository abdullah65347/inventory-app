import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AdminProductResponse } from '../../../common/models/product.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  animations: [fadeIn]
})
export class AdminProductsComponent implements OnInit {
  private svc = inject(ProductService);
  private toast = inject(ToastService);

  products = signal<AdminProductResponse[]>([]);
  filtered = signal<AdminProductResponse[]>([]);
  loading = signal(true);
  search = '';
  priceTarget = signal<AdminProductResponse | null>(null);
  newPrice = 0;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAdminProducts().subscribe({
      next: p => { this.products.set(p); this.filter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  filter(): void {
    const s = this.search.toLowerCase();
    this.filtered.set(this.products().filter(p =>
      p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) ||
      (p.supplierName ?? '').toLowerCase().includes(s)
    ));
  }

  openPrice(p: AdminProductResponse): void { this.priceTarget.set(p); this.newPrice = p.adminToUserPrice ?? 0; }
  closePrice(): void { this.priceTarget.set(null); }

  savePrice(): void {
    const t = this.priceTarget();
    if (!t || this.newPrice <= 0) { this.toast.warning('Enter a valid price'); return; }
    this.svc.updateAdminPrice(t.id, this.newPrice).subscribe({
      next: () => { this.toast.success('Selling price updated'); this.closePrice(); this.load(); },
      error: () => this.toast.error('Update failed')
    });
  }

  get margin(): number {
    const t = this.priceTarget();
    if (!t || !this.newPrice) return 0;
    return this.newPrice - t.supplierToAdminPrice;
  }
  get marginPct(): number {
    const t = this.priceTarget();
    if (!t || !t.supplierToAdminPrice) return 0;
    return Math.round(this.margin / t.supplierToAdminPrice * 100);
  }
}
