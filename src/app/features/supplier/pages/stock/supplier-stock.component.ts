import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierService } from '../../../admin/services/supplier.service';
import { SupplierProductService } from '../../services/supplier-product.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SupplierProductResponse } from '../../../common/models/product.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
  selector: 'app-supplier-stock',
  standalone: true,
  imports: [CommonModule, LoaderComponent],
  templateUrl: './supplier-stock.component.html',
  styleUrls: ['./supplier-stock.component.css'],
  animations: [fadeIn]
})
export class SupplierStockComponent implements OnInit {
  auth        = inject(AuthService);
  supplierSvc = inject(SupplierService);
  productSvc  = inject(SupplierProductService);

  products = signal<SupplierProductResponse[]>([]);
  loading  = signal(true);

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.supplierSvc.getByUser(user.id).subscribe({
      next: s => {
        this.productSvc.getBySupplier(s.id).subscribe({
          next: p => { this.products.set(p); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }

  stockPct(p: SupplierProductResponse): number {
    const max = Math.max(...this.products().map(x => x.availableStock), 1);
    return Math.round(p.availableStock / max * 100);
  }

  get totalStock(): number { return this.products().reduce((s, p) => s + p.availableStock, 0); }
  get lowStock():   number { return this.products().filter(p => p.availableStock < 10).length; }
}
