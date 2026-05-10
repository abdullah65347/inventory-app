import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { SaleService } from '../../../user/services/sale.service';
import { SaleResponse } from '../../../common/models/sale.model';
import { paymentModeBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
    selector: 'app-staff-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './staff-dashboard.component.html',
    animations: [fadeIn]
})
export class StaffDashboardComponent implements OnInit {
    private auth = inject(AuthService);
    private saleSvc = inject(SaleService);

    recentSales = signal<SaleResponse[]>([]);
    totalToday = signal(0);
    revenueToday = signal(0);
    totalAllTime = signal(0);
    paymentModeBadge = paymentModeBadge;

    ngOnInit(): void {
        const user = this.auth.currentUser();
        if (!user) return;
        this.saleSvc.getBySoldBy(user.id).subscribe({
            next: sales => {
                this.totalAllTime.set(sales.length);
                this.recentSales.set(sales.slice(0, 5));
                const today = new Date().toDateString();
                const todaySales = sales.filter(s => new Date(s.saleDate).toDateString() === today);
                this.totalToday.set(todaySales.length);
                this.revenueToday.set(todaySales.reduce((sum, s) => sum + s.totalAmount, 0));
            }
        });
    }
}