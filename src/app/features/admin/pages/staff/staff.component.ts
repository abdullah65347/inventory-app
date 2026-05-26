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

@Component({
    selector: 'app-staff',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    templateUrl: './staff.component.html',
    // styleUrls: ['./staff.component.css'],
    animations: [fadeIn]
})
export class StaffComponent implements OnInit {
    private svc = inject(StaffService);
    private managerSvc = inject(ManagerService);
    private userSvc = inject(UserService);
    private toast = inject(ToastService);

    staffList = signal<StaffResponse[]>([]);
    managers = signal<ManagerResponse[]>([]);
    availableUsers = signal<User[]>([]);
    loading = signal(true);
    showCreate = signal(false);

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
            next: s => { this.staffList.set(s); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
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