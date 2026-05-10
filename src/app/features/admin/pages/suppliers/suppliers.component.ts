import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplierService } from '../../services/supplier.service';
import { CategoryService } from '../../services/category.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SupplierResponse, SupplierRequest } from '../../../common/models/supplier.model';
import { CategoryResponse } from '../../../common/models/category.model';
import { User } from '../../../../core/models/user.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
  selector: 'app-admin-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
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
  categories = signal<CategoryResponse[]>([]);
  supplierUsers = signal<User[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editTarget = signal<SupplierResponse | null>(null);
  form: SupplierRequest = { userId: 0, categoryId: 0, companyName: '', address: '' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: s => { this.suppliers.set(s); this.loading.set(false); }, error: () => this.loading.set(false) });
    this.catSvc.getAll().subscribe({ next: c => this.categories.set(c) });
    this.userSvc.getAll().subscribe({ next: u => this.supplierUsers.set(u.filter(x => x.role === 'ROLE_SUPPLIER')) });
  }

  openCreate(): void { this.editTarget.set(null); this.form = { userId: 0, categoryId: 0, companyName: '', address: '' }; this.showModal.set(true); }
  openEdit(s: SupplierResponse): void { this.editTarget.set(s); this.form = { userId: s.userId, categoryId: s.categoryId, companyName: s.companyName, address: s.address }; this.showModal.set(true); }
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
