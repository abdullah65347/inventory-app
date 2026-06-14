import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/user.model';
import { initials, roleBadgeClass, roleLabel, statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { ViewDetailModalComponent, ViewField } from 'src/app/shared/components/view-detail-modal/view-detail-modal.component';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { getAvatarGradient } from 'src/app/core/utils/avatar.util';
import { ROLES } from 'src/app/shared/constants/roles.constant';
import { StatStripComponent, StatStripItem } from 'src/app/shared/components/stats-strip/stat-strip.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, StatStripComponent, ViewDetailModalComponent, AppTableComponent, PaginatorComponent],
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
  selectedRole = '';
  selectedSort = '';

  roleFilterOptions = [
    { value: 'ROLE_ADMIN', label: 'Admin' },
    { value: 'ROLE_MANAGER', label: 'Manager' },
    { value: 'ROLE_STAFF', label: 'Staff' },
    { value: 'ROLE_SUPPLIER', label: 'Supplier' },
    { value: 'ROLE_USER', label: 'User' },
  ];

  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'email_asc', label: 'Email (A-Z)' },
    { value: 'email_desc', label: 'Email (Z-A)' },
    { value: 'joined_desc', label: 'Newest Joined' },
    { value: 'joined_asc', label: 'Oldest Joined' },
  ];

  dashboardStats = computed<StatStripItem[]>(() => [
    { icon: 'bi-people-fill', value: this.users().length, label: 'Total Users', iconClass: 'icon-primary', format: 'number' },
    { icon: 'bi-person-workspace', value: this.users().filter(u => u.role === 'ROLE_MANAGER').length, label: 'Managers', iconClass: 'icon-accent', format: 'number' },
    { icon: 'bi-person-badge-fill', value: this.users().filter(u => u.role === 'ROLE_STAFF').length, label: 'Staff', iconClass: 'icon-success', format: 'number' },
    { icon: 'bi-truck', value: this.users().filter(u => u.role === 'ROLE_SUPPLIER').length, label: 'Suppliers', iconClass: 'icon-warning', format: 'number' },
    {
      icon: 'bi-person-plus-fill', value: this.users().filter(u => {
        const created = new Date(u.createdAt ?? '');
        const today = new Date();
        return created.getMonth() === today.getMonth() &&
          created.getFullYear() === today.getFullYear();
      }).length, label: 'New Users', iconClass: 'icon-danger', format: 'number'
    }
  ]);

  // edit
  showModal = signal(false);
  editTarget = signal<User | null>(null);
  editForm: Partial<User> = {};

  // register new user with role
  showRegister = signal(false);
  registerForm = { name: '', email: '', phone: '', address: '', password: '', role: 'ROLE_MANAGER' };
  availableRoles = ['ROLE_MANAGER', 'ROLE_STAFF', 'ROLE_SUPPLIER'];

  initials = initials;
  getAvatarGradient = getAvatarGradient;
  roleBadgeClass = roleBadgeClass;
  roleLabel = roleLabel;
  statusBadge = statusBadge;
  showViewModal = signal(false);
  showAssignRole = signal(false);
  selectedUser: User | null = null;

  viewFields: ViewField[] = [
    {
      key: 'name',
      label: 'Full Name',
      width: 'half'
    },
    {
      key: 'email',
      label: 'Email',
      width: 'half'
    },
    {
      key: 'phone',
      label: 'Phone',
      width: 'half'
    },
    {
      key: 'role',
      label: 'Role',
      width: 'half'
    },
    {
      key: 'address',
      label: 'Address',
      width: 'full'
    },
    {
      key: 'active',
      label: 'Status',
      width: 'half'
    },
    {
      key: 'createdAt',
      label: 'Created At',
      width: 'half'
    },
    {
      key: 'updatedAt',
      label: 'Updated At',
      width: 'half'
    }
  ];

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
    let list = this.users().filter(u =>
      u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );

    if (this.selectedRole) {
      list = list.filter(u => u.role === this.selectedRole);
    }

    if (this.selectedSort) {
      list = [...list].sort((a, b) => {
        switch (this.selectedSort) {
          case 'name_asc': return a.name.localeCompare(b.name);
          case 'name_desc': return b.name.localeCompare(a.name);
          case 'email_asc': return a.email.localeCompare(b.email);
          case 'email_desc': return b.email.localeCompare(a.email);
          case 'joined_desc': return new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime();
          case 'joined_asc': return new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime();
          default: return 0;
        }
      });
    }

    this.filtered.set(list);
    this.page.set(1); // reset on filter change
  }
  viewUser(user: User): void {
    this.selectedUser = user;
    this.showViewModal.set(true);
  }

  closeViewDetailModal(): void {
    this.showViewModal.set(false);
    this.selectedUser = null;
  }

  openEdit(u: User): void {
    this.editTarget.set(u);

    this.editForm = {
      name: u.name,
      email: u.email,
      phone: u.phone,
      address: u.address,
    };

    this.showModal.set(true);
  }

  assignableRoles = [
    'ROLE_MANAGER',
    'ROLE_STAFF',
    'ROLE_SUPPLIER'
  ];

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
    if (u.role === ROLES.ADMIN) return;

    this.svc.toggleActive(u.id, !u.active).subscribe({
      next: () => {
        this.toast.success(`User ${u.active ? 'deactivated' : 'activated'}`);
        this.load();
      }
    });
  }

  deleteUser(u: User): void {
    if (u.role === ROLES.ADMIN) return;

    if (!confirm(`Delete "${u.name}"? This cannot be undone.`)) return;

    this.svc.delete(u.id).subscribe({
      next: () => {
        this.toast.success('User deleted');
        this.load();
      }
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

  openAssign(user: User): void {
    this.selectedUser = user;
    this.selectedRole = '';
    this.showAssignRole.set(true);
  }

  closeAssign(): void {
    this.showAssignRole.set(false);
    this.selectedUser = null;
    this.selectedRole = '';
  }

  assignRole(): void {
    if (!this.selectedUser || !this.selectedRole) return;

    this.svc.assignRole(
      this.selectedUser.id,
      this.selectedRole
    ).subscribe({
      next: () => {
        this.toast.success('Role assigned successfully');
        this.closeAssign();
        this.load();
      },
      error: () => {
        this.toast.error('Failed to assign role');
      }
    });
  }

}