import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { CategoryService } from '../../services/category.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SupplierResponse, SupplierRequest } from '../../../common/models/supplier.model';
import { CategoryResponse } from '../../../common/models/category.model';
import { User } from '../../../../core/models/user.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { initials } from 'src/app/core/utils/role.util';
import { getAvatarGradient } from 'src/app/core/utils/avatar.util';
import { SupplierFormComponent } from '../../components/supplier-form/supplier-form.component';
import { forkJoin } from 'rxjs';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';

@Component({
  selector: 'app-admin-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, SupplierFormComponent, AppTableComponent, PaginatorComponent],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css'],
  animations: [fadeIn]
})
export class SuppliersComponent implements OnInit {
  private svc = inject(SupplierService);
  private catSvc = inject(CategoryService);
  private userSvc = inject(UserService);
  private toast = inject(ToastService);

  suppliers = signal<SupplierResponse[]>([]);
  filtered = signal<SupplierResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  categoryFilterOptions: { value: any, label: string }[] = [];
  supplierUsers = signal<User[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editTarget = signal<SupplierResponse | null>(null);
  form: SupplierRequest = { userId: 0, categoryId: 0, companyName: '', address: '' };
  initials = initials;
  getAvatarGradient = getAvatarGradient;
  availableUsers = signal<User[]>([]);
  isEdit = signal(false);

  page = signal(1);
  pageSize = signal(10);
  search = '';
  selectedCategory = '';
  selectedSort = '';

  sortOptions = [
    { value: 'name_asc', label: 'Company Name (A-Z)' },
    { value: 'name_desc', label: 'Company Name (Z-A)' },
    { value: 'address_asc', label: 'Address (A-Z)' },
    { value: 'address_desc', label: 'Address (Z-A)' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next: s => { this.suppliers.set(s); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.catSvc.getAll().subscribe({
      next: c => {
        this.categories.set(c);
        this.categoryFilterOptions = c.map(cat => ({ value: cat.id, label: cat.name }));
      }
    });
    this.userSvc.getAll().subscribe({ next: u => this.supplierUsers.set(u.filter(x => x.role === 'ROLE_SUPPLIER')) });
  }

  applyFilter(): void {
    const s = this.search.toLowerCase();
    let list = this.suppliers().filter(sup =>
      sup.companyName.toLowerCase().includes(s) || (sup.address || '').toLowerCase().includes(s) || (sup.userName || '').toLowerCase().includes(s)
    );

    if (this.selectedCategory) {
      const catId = Number(this.selectedCategory);
      list = list.filter(sup => sup.categoryId === catId);
    }

    if (this.selectedSort) {
      list = [...list].sort((a, b) => {
        switch (this.selectedSort) {
          case 'name_asc': return a.companyName.localeCompare(b.companyName);
          case 'name_desc': return b.companyName.localeCompare(a.companyName);
          case 'address_asc': return (a.address || '').localeCompare(b.address || '');
          case 'address_desc': return (b.address || '').localeCompare(a.address || '');
          default: return 0;
        }
      });
    }

    this.filtered.set(list);
    this.page.set(1);
  }

  get paged(): PageResult<SupplierResponse> {
    return paginate(this.filtered(), this.page(), this.pageSize());
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  openCreate(): void {
    this.isEdit.set(false);
    forkJoin({
      users: this.userSvc.getAll(),
      existing: this.svc.getAll()
    }).subscribe({

      next: ({ users, existing }) => {

        const takenUserIds = new Set(
          existing.map(s => s.userId)
        );

        this.availableUsers.set(
          users.filter(
            u =>
              u.role === 'ROLE_SUPPLIER' &&
              !takenUserIds.has(u.id)
          )
        );

        this.editTarget.set(null);

        this.form = {
          userId: null as number | null,
          categoryId: 0,
          companyName: '',
          address: ''
        };

        this.showModal.set(true);
      }
    });
  }
  openEdit(s: SupplierResponse): void {
    this.isEdit.set(true);
    forkJoin({
      users: this.userSvc.getAll(),
      existing: this.svc.getAll()
    }).subscribe({

      next: ({ users, existing }) => {

        const takenUserIds = new Set(
          existing
            .filter(x => x.id !== s.id)
            .map(x => x.userId)
        );

        this.availableUsers.set(
          users.filter(
            u =>
              u.role === 'ROLE_SUPPLIER' &&
              !takenUserIds.has(u.id)
          )
        );

        this.editTarget.set(s);

        this.form = {
          userId: s.userId,
          categoryId: s.categoryId,
          companyName: s.companyName,
          address: s.address
        };

        this.showModal.set(true);
      }
    });
  }
  closeModal(): void { this.showModal.set(false); }

  save(): void {
    const t = this.editTarget();
    const obs = t ? this.svc.update(t.id, this.form) : this.svc.create(this.form);
    obs.subscribe({
      next: () => { this.toast.success(t ? 'Supplier updated' : 'Supplier created'); this.closeModal(); this.load(); },
      error: () => this.toast.error('Save failed')
    });
  }

  toggleActive(s: SupplierResponse): void {
    this.svc.toggleActive(s.id, !s.active).subscribe({
      next: () => { this.toast.success(`Supplier ${s.active ? 'deactivated' : 'activated'}`); this.load(); },
      error: () => this.toast.error('Update failed')
    });
  }

  delete(s: SupplierResponse): void {
    if (!confirm(`Delete "${s.companyName}"?`)) return;
    this.svc.delete(s.id).subscribe({
      next: () => { this.toast.success('Deleted'); this.load(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
