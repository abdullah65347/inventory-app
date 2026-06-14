import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { CategoryResponse } from '../../../common/models/category.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { paginate, PageResult } from '../../../../core/utils/paginate.util';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, AppTableComponent, PaginatorComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  animations: [fadeIn]
})
export class CategoriesComponent implements OnInit {
  private svc = inject(CategoryService);
  private toast = inject(ToastService);

  categories = signal<CategoryResponse[]>([]);
  filtered = signal<CategoryResponse[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editTarget = signal<CategoryResponse | null>(null);
  formName = '';

  page = signal(1);
  pageSize = signal(10);
  search = '';
  selectedSort = '';

  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'products_desc', label: 'Products Count (High to Low)' },
    { value: 'products_asc', label: 'Products Count (Low to High)' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getCategoryCount().subscribe({
      next: c => { this.categories.set(c); this.applyFilter(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilter(): void {
    const s = this.search.toLowerCase();
    let list = this.categories().filter(c => c.name.toLowerCase().includes(s));

    if (this.selectedSort) {
      list = [...list].sort((a, b) => {
        switch (this.selectedSort) {
          case 'name_asc': return a.name.localeCompare(b.name);
          case 'name_desc': return b.name.localeCompare(a.name);
          case 'products_desc': return (b.totalProducts || 0) - (a.totalProducts || 0);
          case 'products_asc': return (a.totalProducts || 0) - (b.totalProducts || 0);
          default: return 0;
        }
      });
    }

    this.filtered.set(list);
    this.page.set(1);
  }

  get paged(): PageResult<CategoryResponse> {
    return paginate(this.filtered(), this.page(), this.pageSize());
  }

  onPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }

  openCreate(): void { this.editTarget.set(null); this.formName = ''; this.showModal.set(true); }
  openEdit(c: CategoryResponse): void { this.editTarget.set(c); this.formName = c.name; this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }

  save(): void {
    if (!this.formName.trim()) { this.toast.warning('Name is required'); return; }
    const t = this.editTarget();
    const obs = t ? this.svc.update(t.id, { name: this.formName }) : this.svc.create({ name: this.formName });
    obs.subscribe({
      next: () => { this.toast.success(t ? 'Updated' : 'Created'); this.closeModal(); this.load(); },
      error: () => this.toast.error('Save failed')
    });
  }

  delete(c: CategoryResponse): void {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    this.svc.delete(c.id).subscribe({
      next: () => { this.toast.success('Deleted'); this.load(); },
      error: () => this.toast.error('Delete failed')
    });
  }
}
