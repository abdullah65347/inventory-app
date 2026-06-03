import { CommonModule } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { RouterModule } from "@angular/router";
import { InventoryService } from "src/app/features/admin/services/inventory.service";
import { InventoryResponse } from "src/app/features/common/models/inventory.model";

@Component({
    selector: 'app-low-stock-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './low-stock-sidebar.component.html',
    styleUrl: './low-stock-sidebar.component.css'
})
export class LowStockSidebarComponent implements OnInit {
    private inventorySvc = inject(InventoryService);
    items = signal<InventoryResponse[]>([]);
    open = signal(false);

    ngOnInit() {
        this.inventorySvc.getLowStock().subscribe({ next: d => this.items.set(d) });
    }

    toggle() { this.open.set(!this.open()); }
    close() { this.open.set(false); }

    getStockPercent(item: InventoryResponse): number {
        if (item.reorderLevel === 0) return 0;
        // Cap at 100, so bar never overflows
        return Math.min((item.availableStock / item.reorderLevel) * 100, 100);
    }
}