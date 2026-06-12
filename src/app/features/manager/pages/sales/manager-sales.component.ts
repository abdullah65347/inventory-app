import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleService } from '../../../user/services/sale.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SaleResponse } from '../../../common/models/sale.model';
import { paymentModeBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';

@Component({
    selector: 'app-manager-sales',
    standalone: true,
    imports: [CommonModule, LoaderComponent, PaginatorComponent],
    templateUrl: './manager-sales.component.html',
    styleUrls: ['./manager-sales.component.css'],
    animations: [fadeIn]
})
export class ManagerSalesComponent implements OnInit {

    private saleSvc = inject(SaleService);

    sales = signal<SaleResponse[]>([]);
    loading = signal(true);
    detailItem = signal<SaleResponse | null>(null);

    paymentModeBadge = paymentModeBadge;

    page = signal(1);
    pageSize = signal(10);

    ngOnInit(): void {
        this.saleSvc.getAll().subscribe({
            next: s => {
                this.sales.set(s);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    get paged(): PageResult<SaleResponse> {
        return paginate(this.sales(), this.page(), this.pageSize());
    }

    onPageSize(size: number): void {
        this.pageSize.set(size);
        this.page.set(1);
    }

    get totalRevenue(): number { return this.sales().reduce((sum, s) => sum + s.totalAmount, 0); }
    get cashSales(): number { return this.sales().filter(s => s.paymentMode === 'CASH').length; }
    get upiSales(): number { return this.sales().filter(s => s.paymentMode === 'UPI').length; }
}
