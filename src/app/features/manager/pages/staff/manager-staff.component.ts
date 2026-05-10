import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { StaffService } from '../../../admin/services/staff.service';
import { ManagerService } from '../../../admin/services/manager.service';
import { SaleService } from '../../../user/services/sale.service';
import { StaffResponse } from '../../../common/models/staff.model';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: 'app-manager-staff',
    standalone: true,
    imports: [CommonModule, LoaderComponent],
    templateUrl: './manager-staff.component.html',
    animations: [fadeIn]
})
export class ManagerStaffComponent implements OnInit {
    private auth = inject(AuthService);
    private staffSvc = inject(StaffService);
    private managerSvc = inject(ManagerService);
    private saleSvc = inject(SaleService);

    staffList = signal<StaffResponse[]>([]);
    salesCount = signal<Record<number, number>>({});
    loading = signal(true);
    error = signal('');

    ngOnInit(): void {
        const user = this.auth.currentUser();

        if (!user) {
            // currentUser not loaded yet — fetch from backend first
            this.auth.fetchMe().pipe(
                switchMap(u => this.managerSvc.getByUser(u.id)),
                switchMap(m => this.staffSvc.getByManager(m.id)),
                catchError(err => {
                    this.error.set('Could not load staff. Make sure your manager profile is set up.');
                    this.loading.set(false);
                    return of([]);
                })
            ).subscribe(staff => this.handleStaff(staff as StaffResponse[]));
            return;
        }

        // user already loaded
        this.managerSvc.getByUser(user.id).pipe(
            switchMap(m => this.staffSvc.getByManager(m.id)),
            catchError(err => {
                this.error.set('Could not load staff. Make sure your manager profile is set up.');
                this.loading.set(false);
                return of([]);
            })
        ).subscribe(staff => this.handleStaff(staff));
    }

    private handleStaff(staff: StaffResponse[]): void {
        this.staffList.set(staff);
        this.loading.set(false);

        // load sale count per staff member
        staff.forEach(s => {
            this.saleSvc.getBySoldBy(s.userId).pipe(
                catchError(() => of([]))
            ).subscribe(sales => {
                this.salesCount.update(c => ({ ...c, [s.id]: sales.length }));
            });
        });
    }
}