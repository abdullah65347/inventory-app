import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { InventoryResponse } from '../../../common/models/inventory.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, AppTableComponent],
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
  filter = 'all';
  reorderTarget = signal<InventoryResponse | null>(null);
  newReorder = 0;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: inv => { this.inventory.set(inv); this.applyFilter(); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  applyFilter(): void {
    let data = this.inventory();
    if (this.filter === 'low') data = data.filter(i => i.availableStock <= i.reorderLevel);
    if (this.filter === 'ok') data = data.filter(i => i.availableStock > i.reorderLevel);
    const s = this.search.toLowerCase();
    if (s) data = data.filter(i => i.productName.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
    this.filtered.set(data);
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
