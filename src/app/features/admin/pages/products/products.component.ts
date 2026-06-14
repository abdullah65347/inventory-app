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
import { ViewDetailModalComponent, ViewField } from 'src/app/shared/components/view-detail-modal/view-detail-modal.component';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, ViewDetailModalComponent, SupplierFormComponent, AppTableComponent, PaginatorComponent],
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
  selectedCategory = '';
  selectedSort = '';
  categoryFilterOptions: { value: any, label: string }[] = [];
  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'sell_asc', label: 'Price (Low to High)' },
    { value: 'sell_desc', label: 'Price (High to Low)' },
    { value: 'stock_desc', label: 'Stock (High to Low)' },
    { value: 'stock_asc', label: 'Stock (Low to High)' },
  ];

  page = signal(1);
  pageSize = signal(10);
  priceTarget = signal<AdminProductResponse | null>(null);
  showCreate = signal(false);
  suppliers = signal<SupplierResponse[]>([]);
  showSupplierModal = signal(false);
  categories = signal<CategoryResponse[]>([]);
  availableUsers = signal<User[]>([]);
  newPrice = 0;
  showViewModal = signal(false);
  selectedProduct: AdminProductResponse | null = null;

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

  viewFields: ViewField[] = [
    {
      key: 'name',
      label: 'Product Name',
      width: 'half'
    },
    {
      key: 'sku',
      label: 'SKU',
      width: 'half'
    },
    {
      key: 'categoryName',
      label: 'Category',
      width: 'half'
    },
    {
      key: 'supplierName',
      label: 'Supplier',
      width: 'half'
    },
    {
      key: 'supplierToAdminPrice',
      label: 'Cost Price',
      width: 'half'
    },
    {
      key: 'adminToUserPrice',
      label: 'Selling Price',
      width: 'half'
    },
    {
      key: 'availableStock',
      label: 'Available Stock',
      width: 'half'
    },
    {
      key: 'active',
      label: 'Status',
      width: 'half'
    },
    {
      key: 'description',
      label: 'Description',
      width: 'full'
    },
    {
      key: 'createdAt',
      label: 'Created At',
      width: 'half'
    }
  ];

  ngOnInit(): void {
    this.load();

    this.supplierService.getAll().subscribe({
      next: res => this.suppliers.set(res)
    });
    this.catSvc.getAll().subscribe({
      next: c => {
        this.categories.set(c);
        this.categoryFilterOptions = c.map(cat => ({ value: cat.id, label: cat.name }));
      }
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

  viewProduct(product: AdminProductResponse): void {
    this.selectedProduct = product;
    this.showViewModal.set(true);
  }

  closeViewDetailModal(): void {
    this.showViewModal.set(false);
    this.selectedProduct = null;
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
    let list = this.products().filter(p =>
      p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) ||
      (p.supplierName ?? '').toLowerCase().includes(s)
    );

    if (this.selectedCategory) {
      const catId = Number(this.selectedCategory);
      list = list.filter(p => p.id === catId);
    }

    if (this.selectedSort) {
      list = [...list].sort((a, b) => {
        switch (this.selectedSort) {
          case 'name_asc': return a.name.localeCompare(b.name);
          case 'name_desc': return b.name.localeCompare(a.name);
          case 'sell_asc': return (a.adminToUserPrice || 0) - (b.adminToUserPrice || 0);
          case 'sell_desc': return (b.adminToUserPrice || 0) - (a.adminToUserPrice || 0);
          case 'stock_desc': return b.availableStock - a.availableStock;
          case 'stock_asc': return a.availableStock - b.availableStock;
          default: return 0;
        }
      });
    }

    this.filtered.set(list);
    this.page.set(1);
  }

  get paged(): PageResult<AdminProductResponse> {
    return paginate(this.filtered(), this.page(), this.pageSize());
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
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
