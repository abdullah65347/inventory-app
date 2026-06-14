import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { InventoryResponse } from '../../../common/models/inventory.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';
import { StatStripComponent, StatStripItem } from 'src/app/shared/components/stats-strip/stat-strip.component';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, StatStripComponent, AppTableComponent, PaginatorComponent],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css'],
  animations: [fadeIn]
})
export class InventoryComponent implements OnInit {
  private svc = inject(InventoryService);
  private toast = inject(ToastService);

  inventory = signal<InventoryResponse[]>([]);
  filtered = signal<InventoryResponse[]>([]);
  loading = signal(true);
  search = '';
  filter = '';
  selectedSort = '';

  statusFilterOptions = [
    { value: 'low', label: 'Low Stock' },
    { value: 'ok', label: 'Healthy Stock' },
  ];

  sortOptions = [
    { value: 'name_asc', label: 'Product Name (A-Z)' },
    { value: 'name_desc', label: 'Product Name (Z-A)' },
    { value: 'stock_desc', label: 'Stock (High to Low)' },
    { value: 'stock_asc', label: 'Stock (Low to High)' },
  ];
  dashboardStats = computed<StatStripItem[]>(() => [
    { icon: 'bi-archive-fill', value: this.inventory().length, label: 'Total Products', iconClass: 'icon-primary', format: 'number' },
    { icon: 'bi-check-circle-fill', value: this.okCount, label: 'Healthy Stock', iconClass: 'icon-success', format: 'number' },
    { icon: 'bi-exclamation-triangle-fill', value: this.lowCount, label: 'Low Stock', iconClass: 'icon-danger', format: 'number' },
    { icon: 'bi-boxes', value: this.totalUnits, label: 'Total Units', iconClass: 'icon-accent', format: 'number' }
  ]);
  reorderTarget = signal<InventoryResponse | null>(null);
  newReorder = 0;
  page = signal(1);
  pageSize = signal(10);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: inv => { this.inventory.set(inv); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter(): void {
    let data = this.inventory();
    if (this.filter === 'low') data = data.filter(i => i.availableStock <= i.reorderLevel);
    if (this.filter === 'ok') data = data.filter(i => i.availableStock > i.reorderLevel);
    const s = this.search.toLowerCase();
    if (s) data = data.filter(i => i.productName.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));

    if (this.selectedSort) {
      data = [...data].sort((a, b) => {
        switch (this.selectedSort) {
          case 'name_asc': return a.productName.localeCompare(b.productName);
          case 'name_desc': return b.productName.localeCompare(a.productName);
          case 'stock_desc': return b.availableStock - a.availableStock;
          case 'stock_asc': return a.availableStock - b.availableStock;
          default: return 0;
        }
      });
    }

    this.filtered.set(data);
    this.page.set(1);
  }

  get paged(): PageResult<InventoryResponse> {
    return paginate(this.filtered(), this.page(), this.pageSize());
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  stockPct(item: InventoryResponse): number {
    return Math.min(100, Math.round(item.availableStock / Math.max(item.reorderLevel * 3, 1) * 100));
  }

  get totalUnits(): number { return this.inventory().reduce((s, i) => s + i.availableStock, 0); }
  get lowCount(): number { return this.inventory().filter(i => i.availableStock <= i.reorderLevel).length; }
  get okCount(): number { return this.inventory().filter(i => i.availableStock > i.reorderLevel).length; }

  openReorder(item: InventoryResponse): void { this.reorderTarget.set(item); this.newReorder = item.reorderLevel; }
  closeReorder(): void { this.reorderTarget.set(null); }

  saveReorder(): void {
    const t = this.reorderTarget();
    if (!t) return;
    this.svc.setReorderLevel(t.productId, this.newReorder).subscribe({
      next: () => { this.toast.success('Reorder level updated'); this.closeReorder(); this.load(); },
      error: () => this.toast.error('Update failed')
    });
  }
}
