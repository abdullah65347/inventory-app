import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { initials, roleBadgeClass, roleLabel, statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { paginate, PageResult } from '../../../../shared/utils/paginate.util';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, PaginatorComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
  animations: [fadeIn]
})
export class UsersComponent implements OnInit {
  private svc = inject(UserService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  users = signal<User[]>([]);
  filtered = signal<User[]>([]);
  loading = signal(true);
  page = signal(1);
  pageSize = signal(10);
  search = '';

  // edit
  showModal = signal(false);
  editTarget = signal<User | null>(null);
  editForm: Partial<User> = {};

  // register new user with role
  showRegister = signal(false);
  registerForm = { name: '', email: '', phone: '', address: '', password: '', role: 'ROLE_MANAGER' };
  availableRoles = ['ROLE_MANAGER', 'ROLE_STAFF', 'ROLE_SUPPLIER'];

  initials = initials; roleBadgeClass = roleBadgeClass; roleLabel = roleLabel; statusBadge = statusBadge;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: u => { this.users.set(u); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  get paged(): PageResult<User> {
    return paginate(this.filtered(), this.page(), this.pageSize());
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  applyFilter(): void {
    const s = this.search.toLowerCase();
    this.filtered.set(this.users().filter(u =>
      u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    ));
    this.page.set(1); // reset on filter change
  }

  openEdit(u: User): void {
    this.editTarget.set(u);
    this.editForm = { name: u.name, email: u.email, phone: u.phone, address: u.address };
    this.showModal.set(true);
  }
  closeModal(): void { this.showModal.set(false); this.editTarget.set(null); }

  save(): void {
    const t = this.editTarget();
    if (!t) return;
    this.svc.update(t.id, this.editForm).subscribe({
      next: () => { this.toast.success('User updated'); this.closeModal(); this.load(); },
      error: () => this.toast.error('Update failed')
    });
  }

  toggleActive(u: User): void {
    this.svc.toggleActive(u.id, !u.active).subscribe({
      next: () => { this.toast.success(`User ${u.active ? 'deactivated' : 'activated'}`); this.load(); },
      error: () => this.toast.error('Failed to update status')
    });
  }

  deleteUser(u: User): void {
    if (!confirm(`Delete "${u.name}"? This cannot be undone.`)) return;
    this.svc.delete(u.id).subscribe({
      next: () => { this.toast.success('User deleted'); this.load(); },
      error: () => this.toast.error('Delete failed')
    });
  }

  openRegister(): void {
    this.registerForm = { name: '', email: '', phone: '', address: '', password: '', role: 'ROLE_MANAGER' };
    this.showRegister.set(true);
  }
  closeRegister(): void { this.showRegister.set(false); }

  submitRegister(): void {
    const { role, ...data } = this.registerForm;
    this.authSvc.registerWithRole(data as any, role).subscribe({
      next: () => { this.toast.success(`${roleLabel(role)} account created`); this.closeRegister(); this.load(); },
      error: err => this.toast.error(err?.error?.message ?? 'Registration failed')
    });
  }
}