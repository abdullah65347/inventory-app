import {
  Component,
  ContentChild,
  Input,
  Output,
  EventEmitter,
  TemplateRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app-table.component.html',
  styleUrls: ['./app-table.component.css']
})
export class AppTableComponent {

  @Input() loading = false;
  @Input() hasData = false;

  // Search Controls
  @Input() showSearch = false;
  @Input() searchQuery = '';
  @Input() searchPlaceholder = 'Search...';
  @Output() search = new EventEmitter<string>();

  // Filter Controls
  @Input() showFilter = false;
  @Input() filterValue = '';
  @Input() filterPlaceholder = 'Filter...';
  @Input() filterOptions: { value: any, label: string }[] = [];
  @Output() filter = new EventEmitter<any>();

  // Sort Controls
  @Input() showSort = false;
  @Input() sortValue = '';
  @Input() sortPlaceholder = 'Sort By';
  @Input() sortOptions: { value: any, label: string }[] = [];
  @Output() sort = new EventEmitter<any>();

  @ContentChild('header')
  headerTemplate!: TemplateRef<any>;

  @ContentChild('body')
  bodyTemplate!: TemplateRef<any>;

  @ContentChild('empty')
  emptyTemplate!: TemplateRef<any>;

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }

  onFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filter.emit(value);
  }

  onSort(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.sort.emit(value);
  }
}