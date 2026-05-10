import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-paginator',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './paginator.component.html',
    styleUrls: ['./paginator.component.css']
})
export class PaginatorComponent implements OnChanges {
    @Input() totalItems = 0;
    @Input() totalPages = 1;
    @Input() currentPage = 1;
    @Input() pageSize = 10;

    @Output() pageChange = new EventEmitter<number>();
    @Output() pageSizeChange = new EventEmitter<number>();

    pages: (number | '...')[] = [];
    pageSizes = [5, 10, 25, 50];

    ngOnChanges(): void {
        this.buildPages();
    }

    buildPages(): void {
        const total = this.totalPages;
        const cur = this.currentPage;
        const pages: (number | '...')[] = [];

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (cur > 3) pages.push('...');
            for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
            if (cur < total - 2) pages.push('...');
            pages.push(total);
        }

        this.pages = pages;
    }

    go(page: number | '...'): void {
        if (page === '...' || page === this.currentPage) return;
        this.pageChange.emit(page as number);
    }

    prev(): void { if (this.currentPage > 1) this.pageChange.emit(this.currentPage - 1); }
    next(): void { if (this.currentPage < this.totalPages) this.pageChange.emit(this.currentPage + 1); }

    onSizeChange(event: Event): void {
        const size = +(event.target as HTMLSelectElement).value;
        this.pageSizeChange.emit(size);
    }

    get start(): number { return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
    get end(): number { return Math.min(this.currentPage * this.pageSize, this.totalItems); }
}