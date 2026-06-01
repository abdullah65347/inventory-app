import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { CategoryResponse } from '../../../common/models/category.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent, AppTableComponent],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
  animations: [fadeIn]
})
export class CategoriesComponent implements OnInit {
  private svc = inject(CategoryService);
  private toast = inject(ToastService);

  categories = signal<CategoryResponse[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editTarget = signal<CategoryResponse | null>(null);
  formName = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getCategoryCount().subscribe({ next: c => { this.categories.set(c); this.loading.set(false); }, error: () => this.loading.set(false) });
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
