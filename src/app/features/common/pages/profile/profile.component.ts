import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';

import { roleLabel } from '../../../../core/utils/role.util';
import { UserService } from '../../../admin/services/user.service';

interface ProfileUser {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    role: string;
}

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

    private auth = inject(AuthService);
    private userService = inject(UserService);
    private toast = inject(ToastService);

    user = signal<ProfileUser | null>(null);

    loading = signal(true);
    pwSaving = signal(false);

    roleLabel = roleLabel;

    pwError = '';

    pwForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    };

    showEditModal = signal(false);

    editForm = {
        name: '',
        phone: '',
        address: ''
    };


    ngOnInit(): void {

        this.auth.fetchMe().subscribe({
            next: (u) => {
                this.user.set(u as ProfileUser);
                this.loading.set(false);
            },

            error: () => {

                const cached = this.auth.currentUser();

                if (cached) {
                    this.user.set(cached as ProfileUser);
                }

                this.loading.set(false);
            }
        });
    }

    getInitials(name: string): string {

        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }


    openEditModal(): void {

        const u = this.user();

        if (!u) return;

        this.editForm = {
            name: u.name,
            phone: u.phone,
            address: u.address
        };

        this.showEditModal.set(true);
    }

    closeEditModal(): void {
        this.showEditModal.set(false);
    }

    updateProfile(): void {

        const u = this.user();

        if (!u) return;

        this.userService.update(u.id, {
            name: this.editForm.name,
            phone: this.editForm.phone,
            address: this.editForm.address
        }).subscribe({

            next: (updated) => {

                this.user.set(updated as ProfileUser);

                this.toast.success('Profile updated');

                this.closeEditModal();
            },

            error: () => {
                this.toast.error('Failed to update profile');
            }
        });
    }

    changePassword(): void {

        this.pwError = '';

        if (!this.pwForm.oldPassword.trim()) {
            this.pwError = 'Current password is required';
            return;
        }

        if (!this.pwForm.newPassword.trim()) {
            this.pwError = 'New password is required';
            return;
        }

        if (this.pwForm.newPassword.length < 6) {
            this.pwError = 'Password must be at least 6 characters';
            return;
        }

        if (this.pwForm.newPassword !== this.pwForm.confirmPassword) {
            this.pwError = 'Passwords do not match';
            return;
        }

        const currentUser = this.user();

        if (!currentUser) return;

        this.pwSaving.set(true);

        this.userService.changePassword(currentUser.id, {
            oldPassword: this.pwForm.oldPassword,
            newPassword: this.pwForm.newPassword
        }).subscribe({

            next: () => {

                this.toast.success('Password updated successfully');

                this.pwForm = {
                    oldPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                };

                this.pwSaving.set(false);
            },

            error: (err: any) => {

                this.pwError =
                    err?.error?.message ??
                    'Failed to update password';

                this.pwSaving.set(false);
            }
        });
    }
}