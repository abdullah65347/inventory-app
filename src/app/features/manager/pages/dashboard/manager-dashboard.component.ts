import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { SaleService } from '../../../user/services/sale.service';
import { PurchaseService } from '../../../admin/services/purchase.service';
import { StaffService } from '../../../admin/services/staff.service';
import { ManagerService } from '../../../admin/services/manager.service';
import { SaleResponse } from '../../../common/models/sale.model';
import { StaffResponse } from '../../../common/models/staff.model';
import { PurchaseResponse } from '../../../common/models/purchase.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { initials } from 'src/app/core/utils/role.util';
import { getAvatarGradient } from 'src/app/core/utils/avatar.util';

@Component({
    selector: 'app-manager-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './manager-dashboard.component.html',
    animations: [fadeIn]
})
export class ManagerDashboardComponent implements OnInit {
    private auth = inject(AuthService);
    private saleSvc = inject(SaleService);
    private purchaseSvc = inject(PurchaseService);
    private staffSvc = inject(StaffService);
    private managerSvc = inject(ManagerService);

    staffList = signal<StaffResponse[]>([]);
    pendingDeliveries = signal<PurchaseResponse[]>([]);
    recentSales = signal<SaleResponse[]>([]);
    totalSalesToday = signal(0);
    totalRevenueToday = signal(0);
    initials = initials;
    getAvatarGradient = getAvatarGradient;

    ngOnInit(): void {
        const user = this.auth.currentUser();
        if (!user) return;

        // get this manager's profile then load their staff
        this.managerSvc.getByUser(user.id).subscribe({
            next: m => {
                this.staffSvc.getByManager(m.id).subscribe({
                    next: s => this.staffList.set(s)
                });
            }
        });

        // delivered purchases waiting for confirmation
        this.purchaseSvc.getByStatus('DELIVERED').subscribe({
            next: p => this.pendingDeliveries.set(p)
        });

        // all sales
        this.saleSvc.getAll().subscribe({
            next: sales => {
                this.recentSales.set(sales.slice(0, 5));
                const today = new Date().toDateString();
                const todaySales = sales.filter(s => new Date(s.saleDate).toDateString() === today);
                this.totalSalesToday.set(todaySales.length);
                this.totalRevenueToday.set(todaySales.reduce((sum, s) => sum + s.totalAmount, 0));
            }
        });
    }
}