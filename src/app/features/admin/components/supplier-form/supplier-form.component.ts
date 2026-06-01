import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-form.component.html'
})
export class SupplierFormComponent {

  @Input() visible = false;

  @Input() form: {
    userId: number | null;
    categoryId: number;
    companyName: string;
    address: string;
  } = {
      userId: null,
      categoryId: 0,
      companyName: '',
      address: ''
    };
  @Input() isEdit = false;
  @Input() categories: any[] = [];
  @Input() supplierUsers: any[] = [];
  @Input() availableUsers: any[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
}