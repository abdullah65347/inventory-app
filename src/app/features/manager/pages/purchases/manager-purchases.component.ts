import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseService } from '../../../admin/services/purchase.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PurchaseResponse } from '../../../common/models/purchase.model';
import { statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';

@Component({
    selector: 'app-manager-purchases',
    standalone: true,
    imports: [CommonModule, LoaderComponent, AppTableComponent, PaginatorComponent],
    templateUrl: './manager-purchases.component.html',
    styleUrls: ['./manager-purchases.component.css'],
    animations: [fadeIn]
})
export class ManagerPurchasesComponent implements OnInit {
    private svc = inject(PurchaseService);
    private toast = inject(ToastService);

    purchases = signal<PurchaseResponse[]>([]);
    filtered = signal<PurchaseResponse[]>([]);
    loading = signal(true);
    detailItem = signal<PurchaseResponse | null>(null);
    statusBadge = statusBadge;

    page = signal(1);
    pageSize = signal(10);
    search = '';
    selectedStatus = '';
    selectedSort = '';

    statusFilterOptions = [
        { value: 'PENDING', label: 'Pending' },
        { value: 'DELIVERED', label: 'Delivered' },
        { value: 'CONFIRMED', label: 'Confirmed' },
    ];

    sortOptions = [
        { value: 'date_desc', label: 'Date (Newest)' },
        { value: 'date_asc', label: 'Date (Oldest)' },
        { value: 'amount_desc', label: 'Amount (High to Low)' },
        { value: 'amount_asc', label: 'Amount (Low to High)' },
    ];

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading.set(true);
        this.svc.getAll().subscribe({
            next: p => { this.purchases.set(p); this.applyFilter(); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    applyFilter(): void {
        const s = this.search.toLowerCase();
        let list = this.purchases().filter(p =>
            (p.supplierName || '').toLowerCase().includes(s) || p.id.toString().includes(s)
        );

        if (this.selectedStatus) {
            list = list.filter(p => p.status === this.selectedStatus);
        }

        if (this.selectedSort) {
            list = [...list].sort((a, b) => {
                switch (this.selectedSort) {
                    case 'date_desc': return new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime();
                    case 'date_asc': return new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime();
                    case 'amount_desc': return b.totalAmount - a.totalAmount;
                    case 'amount_asc': return a.totalAmount - b.totalAmount;
                    default: return 0;
                }
            });
        }

        this.filtered.set(list);
        this.page.set(1);
    }

    get paged(): PageResult<PurchaseResponse> {
        return paginate(this.filtered(), this.page(), this.pageSize());
    }

    onPageSize(size: number): void {
        this.pageSize.set(size);
        this.page.set(1);
    }

    confirm(p: PurchaseResponse): void {
        if (!confirm('Confirm delivery? Inventory will be updated.')) return;
        this.svc.confirm(p.id).subscribe({
            next: () => { this.toast.success('Delivery confirmed and inventory updated'); this.load(); },
            error: err => this.toast.error(err?.error?.message ?? 'Failed')
        });
    }

    get pendingCount(): number { return this.purchases().filter(p => p.status === 'PENDING').length; }
    get deliveredCount(): number { return this.purchases().filter(p => p.status === 'DELIVERED').length; }
    get confirmedCount(): number { return this.purchases().filter(p => p.status === 'CONFIRMED').length; }
}
