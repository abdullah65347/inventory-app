import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SaleService } from '../../../user/services/sale.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

import { SaleResponse } from '../../../common/models/sale.model';

import { fadeIn } from '../../../../shared/animations/fade.animation';
import { paymentModeBadge } from '../../../../core/utils/role.util';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';
import { Router } from '@angular/router';
import { StatStripComponent, StatStripItem } from 'src/app/shared/components/stats-strip/stat-strip.component';

@Component({
  selector: 'app-admin-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoaderComponent,
    AppTableComponent,
    StatStripComponent,
    PaginatorComponent
  ],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
  animations: [fadeIn]
})
export class AdminSalesComponent implements OnInit {

  private svc = inject(SaleService);
  private toast = inject(ToastService);

  sales = signal<SaleResponse[]>([]);
  filtered = signal<SaleResponse[]>([]);
  loading = signal<boolean>(true);
  detailItem = signal<SaleResponse | null>(null);

  paymentModeBadge = paymentModeBadge;
  page = signal(1);
  pageSize = signal(10);
  search = '';
  selectedPaymentMode = '';
  selectedSort = '';

  paymentModeFilterOptions = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
  ];

  dashboardStats = computed<StatStripItem[]>(() => [
    { icon: 'bi-receipt-cutoff', value: this.sales().length, label: 'Total Orders', iconClass: 'icon-primary', format: 'number' },
    { icon: 'bi-box-seam', value: this.totalProductsSold, label: 'Products Sold', iconClass: 'icon-accent', format: 'number' },
    { icon: 'bi-graph-up-arrow', value: this.averageOrderValue, label: 'Avg Order Value', iconClass: 'icon-warning', format: 'currency' },
    { icon: 'bi-currency-rupee', value: this.totalRevenue, label: 'Total Revenue', iconClass: 'icon-success', format: 'currency' }
  ]);

  sortOptions = [
    { value: 'date_desc', label: 'Date (Newest)' },
    { value: 'date_asc', label: 'Date (Oldest)' },
    { value: 'amount_desc', label: 'Amount (High to Low)' },
    { value: 'amount_asc', label: 'Amount (Low to High)' },
  ];

  ngOnInit(): void {
    this.load();
  }

  constructor(
    private router: Router
  ) { }

  openCreateSale() {
    this.router.navigate(['/admin/sales/create']);
  }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: (res) => {
        this.sales.set(res);
        this.applyFilter();
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.toast.error(
          err?.error?.message || 'Failed to load sales'
        );
        this.loading.set(false);
      }
    });
  }

  applyFilter(): void {
    const s = this.search.toLowerCase();
    let list = this.sales().filter(sale =>
      (sale.customerName || '').toLowerCase().includes(s) || sale.id.toString().includes(s) || (sale.soldByName || '').toLowerCase().includes(s)
    );

    if (this.selectedPaymentMode) {
      list = list.filter(sale => sale.paymentMode === this.selectedPaymentMode);
    }

    if (this.selectedSort) {
      list = [...list].sort((a, b) => {
        switch (this.selectedSort) {
          case 'date_desc': return new Date(b.saleDate ?? '').getTime() - new Date(a.saleDate ?? '').getTime();
          case 'date_asc': return new Date(a.saleDate ?? '').getTime() - new Date(b.saleDate ?? '').getTime();
          case 'amount_desc': return b.totalAmount - a.totalAmount;
          case 'amount_asc': return a.totalAmount - b.totalAmount;
          default: return 0;
        }
      });
    }

    this.filtered.set(list);
    this.page.set(1);
  }

  get paged(): PageResult<SaleResponse> {
    return paginate(this.filtered(), this.page(), this.pageSize());
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  openDetails(sale: SaleResponse): void {
    this.detailItem.set(sale);
  }

  closeDetails(): void {
    this.detailItem.set(null);
  }
  get totalRevenue(): number {
    return this.sales()
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  }

  get totalProductsSold(): number {
    return this.sales()
      .reduce(
        (total, sale) =>
          total +
          sale.items.reduce(
            (itemTotal, item) => itemTotal + item.quantity,
            0
          ),
        0
      );
  }

  get averageOrderValue(): number {
    return this.sales().length > 0
      ? this.totalRevenue / this.sales().length
      : 0;
  }

}