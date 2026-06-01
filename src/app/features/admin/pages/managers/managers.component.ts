import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManagerService } from '../../services/manager.service';
import { StaffService } from '../../services/staff.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ManagerResponse } from '../../../common/models/manager.model';
import { StaffResponse } from '../../../common/models/staff.model';
import { User } from '../../../../core/models/user.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { forkJoin } from 'rxjs';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { initials } from 'src/app/core/utils/role.util';
import { getAvatarGradient } from 'src/app/core/utils/avatar.util';

@Component({
    selector: 'app-managers',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent, AppTableComponent],
    templateUrl: './managers.component.html',
    styleUrls: ['./managers.component.css'],
    animations: [fadeIn]
})
export class ManagersComponent implements OnInit {
    private svc = inject(ManagerService);
    private staffSvc = inject(StaffService);
    private userSvc = inject(UserService);
    private toast = inject(ToastService);

    initials = initials;
    getAvatarGradient = getAvatarGradient;
    managers = signal<ManagerResponse[]>([]);
    loading = signal(true);
    showCreate = signal(false);
    viewStaff = signal<StaffResponse[]>([]);
    viewStaffFor = signal<ManagerResponse | null>(null);

    // users with ROLE_MANAGER who don't have a profile yet
    availableUsers = signal<User[]>([]);

    createForm = { userId: 0, department: '' };

    ngOnInit(): void { this.load(); }

    editTarget = signal<ManagerResponse | null>(null);

    form = {
        userId: 0,
        department: ''
    };

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
                    users.filter(
                        u => u.role === 'ROLE_MANAGER' && !takenUserIds.has(u.id)
                    )
                );

                this.editTarget.set(null);
                this.form = {
                    userId: 0,
                    department: ''
                };

                this.showCreate.set(true);
            }
        });
    }

    save(): void {
        if (!this.form.userId) {
            this.toast.error('Select a user');
            return;
        }

        const target = this.editTarget();

        const obs = target
            ? this.svc.update(target.id, this.form)
            : this.svc.create(this.form);

        obs.subscribe({
            next: () => {
                this.toast.success(
                    target
                        ? 'Manager updated'
                        : 'Manager profile created'
                );

                this.closeModal();
                this.load();
            },
            error: err => {
                this.toast.error(err?.error?.message ?? 'Save failed');
            }
        });
    }

    openEdit(m: ManagerResponse): void {
        this.editTarget.set(m);

        this.form = {
            userId: m.userId,
            department: m.department
        };

        this.showCreate.set(true);
    }

    closeModal(): void {
        this.showCreate.set(false);
        this.editTarget.set(null);
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