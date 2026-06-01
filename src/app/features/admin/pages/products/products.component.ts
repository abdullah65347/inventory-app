import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AdminProductResponse } from '../../../common/models/product.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { SupplierService } from '../../services/supplier.service';
import { SupplierResponse } from 'src/app/features/common/models/supplier.model';
import { SupplierFormComponent } from '../../components/supplier-form/supplier-form.component';
import { CategoryService } from '../../services/category.service';
import { UserService } from '../../services/user.service';
import { CategoryResponse } from 'src/app/features/common/models/category.model';
import { User } from 'src/app/core/models/user.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, SupplierFormComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
  animations: [fadeIn]
})
export class AdminProductsComponent implements OnInit {
  private svc = inject(ProductService);
  private toast = inject(ToastService);
  private supplierService = inject(SupplierService);
  private catSvc = inject(CategoryService);
  private userSvc = inject(UserService);

  products = signal<AdminProductResponse[]>([]);
  filtered = signal<AdminProductResponse[]>([]);
  loading = signal(true);
  search = '';
  priceTarget = signal<AdminProductResponse | null>(null);
  showCreate = signal(false);
  suppliers = signal<SupplierResponse[]>([]);
  showSupplierModal = signal(false);
  categories = signal<CategoryResponse[]>([]);
  availableUsers = signal<User[]>([]);
  newPrice = 0;

  supplierForm = {
    userId: null as number | null,
    categoryId: 0,
    companyName: '',
    address: ''
  };

  createForm = {
    name: '',
    description: '',
    sku: '',
    supplierId: null as number | null,
    costPrice: 0,
    sellingPrice: 0,
    quantity: 0
  };

  ngOnInit(): void {
    this.load();

    this.supplierService.getAll().subscribe({
      next: res => this.suppliers.set(res)
    });
    this.catSvc.getAll().subscribe({
      next: c => this.categories.set(c)
    });
  }

  load(): void {
    this.loading.set(true);
    this.svc.getAdminProducts().subscribe({
      next: p => { this.products.set(p); this.filter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openSupplierModal(): void {

    forkJoin({
      users: this.userSvc.getAll(),
      existing: this.supplierService.getAll()
    }).subscribe({

      next: ({ users, existing }) => {

        const takenUserIds = new Set(
          existing
            .filter(s => s.userId)
            .map(s => s.userId)
        );

        this.availableUsers.set(
          users.filter(
            u =>
              u.role === 'ROLE_SUPPLIER' &&
              !takenUserIds.has(u.id)
          )
        );

        this.supplierForm = {
          userId: null,
          categoryId: 0,
          companyName: '',
          address: ''
        };

        this.showSupplierModal.set(true);
      }
    });
  }

  closeSupplierModal(): void {
    this.showSupplierModal.set(false);
  }

  openCreate(): void {
    this.showCreate.set(true);
  }

  closeCreate(): void {
    this.showCreate.set(false);
  }
  saveSupplier(): void {

    this.supplierService.create(this.supplierForm)
      .subscribe({

        next: supplier => {

          this.suppliers.update(list => [
            ...list,
            supplier
          ]);

          this.createForm.supplierId = supplier.id;

          this.showSupplierModal.set(false);

          this.toast.success('Supplier created');
        },

        error: () => {
          this.toast.error('Failed to create supplier');
        }
      });
  }

  createProduct(): void {

    if (!this.createForm.supplierId) {
      this.toast.warning('Please select a supplier');
      return;
    }

    this.svc.createByAdmin(this.createForm).subscribe({
      next: () => {
        this.toast.success('Product created');
        this.closeCreate();
        this.load();
      },
      error: () => {
        this.toast.error('Creation failed');
      }
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
