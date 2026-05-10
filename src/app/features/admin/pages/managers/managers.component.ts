import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerService } from '../../services/manager.service';
import { StaffService } from '../../services/staff.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ManagerResponse } from '../../../common/models/manager.model';
import { StaffResponse } from '../../../common/models/staff.model';
import { User } from '../../../../core/models/user.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-managers',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    templateUrl: './managers.component.html',
    // styleUrls: ['./managers.component.css'],
    animations: [fadeIn]
})
export class ManagersComponent implements OnInit {
    private svc = inject(ManagerService);
    private staffSvc = inject(StaffService);
    private userSvc = inject(UserService);
    private toast = inject(ToastService);

    managers = signal<ManagerResponse[]>([]);
    loading = signal(true);
    showCreate = signal(false);
    viewStaff = signal<StaffResponse[]>([]);
    viewStaffFor = signal<ManagerResponse | null>(null);

    // users with ROLE_MANAGER who don't have a profile yet
    availableUsers = signal<User[]>([]);

    createForm = { userId: 0, department: '' };

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading.set(true);
        this.svc.getAll().subscribe({
            next: m => { this.managers.set(m); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    openCreate(): void {
        forkJoin({
            users: this.userSvc.getAll(),
            existing: this.svc.getAll()
        }).subscribe({
            next: ({ users, existing }) => {
                const takenUserIds = new Set(existing.map(m => m.userId));
                this.availableUsers.set(
                    users.filter(u => u.role === 'ROLE_MANAGER' && !takenUserIds.has(u.id))
                );
                this.createForm = { userId: 0, department: '' };
                this.showCreate.set(true);
            }
        });
    }

    create(): void {
        if (!this.createForm.userId) { this.toast.error('Select a user'); return; }
        this.svc.create(this.createForm).subscribe({
            next: () => { this.toast.success('Manager profile created'); this.showCreate.set(false); this.load(); },
            error: err => this.toast.error(err?.error?.message ?? 'Failed')
        });
    }

    toggleActive(m: ManagerResponse): void {
        this.svc.toggleActive(m.id, !m.active).subscribe({
            next: () => { this.toast.success(`Manager ${m.active ? 'deactivated' : 'activated'}`); this.load(); },
            error: () => this.toast.error('Failed')
        });
    }

    openStaffView(m: ManagerResponse): void {
        this.viewStaffFor.set(m);
        this.staffSvc.getByManager(m.id).subscribe({
            next: s => this.viewStaff.set(s),
            error: () => this.viewStaff.set([])
        });
    }
}