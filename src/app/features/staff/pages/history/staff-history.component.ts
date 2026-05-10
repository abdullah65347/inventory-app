import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { SaleService } from '../../../user/services/sale.service';
import { SaleResponse } from '../../../common/models/sale.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { paymentModeBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
    selector: 'app-staff-history',
    standalone: true,
    imports: [CommonModule, LoaderComponent],
    templateUrl: './staff-history.component.html',
    animations: [fadeIn]
})
export class StaffHistoryComponent implements OnInit {
    private auth = inject(AuthService);
    private saleSvc = inject(SaleService);

    sales = signal<SaleResponse[]>([]);
    loading = signal(true);
    detailItem = signal<SaleResponse | null>(null);
    paymentModeBadge = paymentModeBadge;

    ngOnInit(): void {
        const user = this.auth.currentUser();
        if (!user) return;
        this.saleSvc.getBySoldBy(user.id).subscribe({
            next: s => { this.sales.set(s); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }
}
