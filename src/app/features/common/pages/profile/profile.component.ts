import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { API_ENDPOINTS } from '../../../../shared/constants/api-endpoints.constant';
import { roleLabel } from '../../../../core/utils/role.util';

interface ProfileUser { id: number; name: string; email: string; phone: string; address: string; role: string; }

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
    private auth = inject(AuthService);
    private api = inject(ApiService);
    private toast = inject(ToastService);

    user = signal<ProfileUser | null>(null);
    loading = signal(true);
    roleLabel = roleLabel;
    pwForm = { newPassword: '', confirmPassword: '' };
    pwError = '';
    pwSaving = signal(false);

    ngOnInit(): void {
        this.auth.fetchMe().subscribe({
            next: u => { this.user.set(u as unknown as ProfileUser); this.loading.set(false); },
            error: () => {
                const cached = this.auth.currentUser();
                if (cached) this.user.set(cached as unknown as ProfileUser);
                this.loading.set(false);
            }
        });
    }

    changePassword(): void {
        this.pwError = '';
        if (!this.pwForm.newPassword) { this.pwError = 'New password is required'; return; }
        if (this.pwForm.newPassword !== this.pwForm.confirmPassword) { this.pwError = 'Passwords do not match'; return; }
        if (this.pwForm.newPassword.length < 6) { this.pwError = 'Must be 6+ characters'; return; }
        const u = this.user();
        if (!u) return;
        this.pwSaving.set(true);
        this.api.put(API_ENDPOINTS.USERS.PASSWORD(u.id), { newPassword: this.pwForm.newPassword }).subscribe({
            next: () => { this.toast.success('Password changed'); this.pwForm = { newPassword: '', confirmPassword: '' }; this.pwSaving.set(false); },
            error: (err: any) => { this.pwError = err?.error?.message ?? 'Failed'; this.pwSaving.set(false); }
        });
    }
}