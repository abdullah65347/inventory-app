import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseService } from '../../../admin/services/purchase.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PurchaseResponse } from '../../../common/models/purchase.model';
import { statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
    selector: 'app-manager-purchases',
    standalone: true,
    imports: [CommonModule, LoaderComponent],
    templateUrl: './manager-purchases.component.html',
    styleUrls: ['./manager-purchases.component.css'],
    animations: [fadeIn]
})
export class ManagerPurchasesComponent implements OnInit {
    private svc = inject(PurchaseService);
    private toast = inject(ToastService);

    purchases = signal<PurchaseResponse[]>([]);
    loading = signal(true);
    detailItem = signal<PurchaseResponse | null>(null);
    statusBadge = statusBadge;

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading.set(true);
        this.svc.getAll().subscribe({
            next: p => { this.purchases.set(p); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
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
