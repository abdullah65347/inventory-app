import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../services/staff.service';
import { ManagerService } from '../../services/manager.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { StaffResponse } from '../../../common/models/staff.model';
import { ManagerResponse } from '../../../common/models/manager.model';
import { User } from '../../../../core/models/user.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { forkJoin } from 'rxjs';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';
import { initials } from 'src/app/core/utils/role.util';
import { getAvatarGradient } from 'src/app/core/utils/avatar.util';

@Component({
    selector: 'app-staff',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent, AppTableComponent, PaginatorComponent],
    templateUrl: './staff.component.html',
    styleUrls: ['./staff.component.css'],
    animations: [fadeIn]
})
export class StaffComponent implements OnInit {
    private svc = inject(StaffService);
    private managerSvc = inject(ManagerService);
    private userSvc = inject(UserService);
    private toast = inject(ToastService);

    staffList = signal<StaffResponse[]>([]);
    filtered = signal<StaffResponse[]>([]);
    managers = signal<ManagerResponse[]>([]);
    availableUsers = signal<User[]>([]);
    loading = signal(true);
    showCreate = signal(false);
    initials = initials;
    getAvatarGradient = getAvatarGradient;

    page = signal(1);
    pageSize = signal(10);
    search = '';
    selectedSort = '';

    sortOptions = [
        { value: 'name_asc', label: 'Name (A-Z)' },
        { value: 'name_desc', label: 'Name (Z-A)' },
        { value: 'manager_asc', label: 'Manager (A-Z)' },
        { value: 'manager_desc', label: 'Manager (Z-A)' },
    ];

    // assign manager
    assignTarget = signal<StaffResponse | null>(null);
    selectedManagerId = 0;

    createForm = { userId: 0, managerId: 0 };

    ngOnInit(): void {
        this.load();
        this.managerSvc.getAll().subscribe({ next: m => this.managers.set(m) });
    }

    load(): void {
        this.loading.set(true);
        this.svc.getAll().subscribe({
            next: s => { this.staffList.set(s); this.applyFilter(); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    applyFilter(): void {
        const s = this.search.toLowerCase();
        let list = this.staffList().filter(st =>
            st.userName.toLowerCase().includes(s) || (st.userEmail || '').toLowerCase().includes(s) || (st.managerName || '').toLowerCase().includes(s)
        );

        if (this.selectedSort) {
            list = [...list].sort((a, b) => {
                switch (this.selectedSort) {
                    case 'name_asc': return a.userName.localeCompare(b.userName);
                    case 'name_desc': return b.userName.localeCompare(a.userName);
                    case 'manager_asc': return (a.managerName || '').localeCompare(b.managerName || '');
                    case 'manager_desc': return (b.managerName || '').localeCompare(a.managerName || '');
                    default: return 0;
                }
            });
        }

        this.filtered.set(list);
        this.page.set(1);
    }

    get paged(): PageResult<StaffResponse> {
        return paginate(this.filtered(), this.page(), this.pageSize());
    }

    onPageSize(size: number): void {
        this.pageSize.set(size);
        this.page.set(1);
    }

    openCreate(): void {
        forkJoin({
            users: this.userSvc.getAll(),
            existing: this.svc.getAll()
        }).subscribe({
            next: ({ users, existing }) => {
                const takenUserIds = new Set(existing.map(s => s.userId));
                this.availableUsers.set(
                    users.filter(u => u.role === 'ROLE_STAFF' && !takenUserIds.has(u.id))
                );
                this.createForm = { userId: 0, managerId: 0 };
                this.showCreate.set(true);
            }
        });
    }

    create(): void {
        if (!this.createForm.userId) { this.toast.error('Select a user'); return; }
        const payload: any = { userId: this.createForm.userId };
        if (this.createForm.managerId) payload.managerId = this.createForm.managerId;
        this.svc.create(payload).subscribe({
            next: () => { this.toast.success('Staff profile created'); this.showCreate.set(false); this.load(); },
            error: err => this.toast.error(err?.error?.message ?? 'Failed')
        });
    }

    openAssign(s: StaffResponse): void {
        this.assignTarget.set(s);
        this.selectedManagerId = s.managerId ?? 0;
    }

    saveAssign(): void {
        const t = this.assignTarget();
        if (!t || !this.selectedManagerId) { this.toast.error('Select a manager'); return; }
        this.svc.assignManager(t.id, this.selectedManagerId).subscribe({
            next: () => { this.toast.success('Manager assigned'); this.assignTarget.set(null); this.load(); },
            error: () => this.toast.error('Failed')
        });
    }

    toggleActive(s: StaffResponse): void {
        this.svc.toggleActive(s.id, !s.active).subscribe({
            next: () => { this.toast.success(`Staff ${s.active ? 'deactivated' : 'activated'}`); this.load(); },
            error: () => this.toast.error('Failed')
        });
    }
}