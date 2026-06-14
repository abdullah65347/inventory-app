import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { TransactionResponse } from '../../../common/models/transaction.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';
import { StatStripComponent, StatStripItem } from 'src/app/shared/components/stats-strip/stat-strip.component';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, StatStripComponent, AppTableComponent, PaginatorComponent],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
  animations: [fadeIn]
})
export class TransactionsComponent implements OnInit {
  private svc = inject(TransactionService);

  transactions = signal<TransactionResponse[]>([]);
  filtered = signal<TransactionResponse[]>([]);
  loading = signal(true);
  search = '';
  typeFilter = '';
  selectedSort = '';

  typeFilterOptions = [
    { value: 'STOCK_IN', label: 'Stock In' },
    { value: 'STOCK_OUT', label: 'Stock Out' },
  ];

  sortOptions = [
    { value: 'date_desc', label: 'Date (Newest)' },
    { value: 'date_asc', label: 'Date (Oldest)' },
    { value: 'qty_desc', label: 'Quantity (High to Low)' },
    { value: 'qty_asc', label: 'Quantity (Low to High)' },
  ];

  dashboardStats = computed<StatStripItem[]>(() => [
    { icon: 'bi-arrow-left-right', value: this.transactions().length, label: 'Total Transactions', iconClass: 'icon-primary', format: 'number' },
    { icon: 'bi-arrow-down-circle-fill', value: this.inCount, label: 'Stock In', iconClass: 'icon-success', format: 'number' },
    { icon: 'bi-arrow-up-circle-fill', value: this.outCount, label: 'Stock Out', iconClass: 'icon-danger', format: 'number' },
    { icon: 'bi-box-seam', value: this.totalMoved, label: 'Units Moved', iconClass: 'icon-warning', format: 'number' }
  ]);

  page = signal(1);
  pageSize = signal(10);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: t => { this.transactions.set(t); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter(): void {
    let data = this.transactions();
    if (this.typeFilter) data = data.filter(t => t.transactionType === this.typeFilter);
    const s = this.search.toLowerCase();
    if (s) data = data.filter(t => t.productName.toLowerCase().includes(s) || t.sku.toLowerCase().includes(s));

    if (this.selectedSort) {
      data = [...data].sort((a, b) => {
        switch (this.selectedSort) {
          case 'date_desc': return new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime();
          case 'date_asc': return new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime();
          case 'qty_desc': return b.quantity - a.quantity;
          case 'qty_asc': return a.quantity - b.quantity;
          default: return 0;
        }
      });
    }

    this.filtered.set(data);
    this.page.set(1);
  }

  get paged(): PageResult<TransactionResponse> {
    return paginate(this.filtered(), this.page(), this.pageSize());
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  get inCount(): number {
    return this.transactions()
      .filter(t => t.transactionType === 'STOCK_IN')
      .length;
  }

  get outCount(): number {
    return this.transactions()
      .filter(t => t.transactionType === 'STOCK_OUT')
      .length;
  }

  get totalMoved(): number {
    return this.transactions()
      .reduce((sum, t) => sum + t.quantity, 0);
  }
}
