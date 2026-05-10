import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { SaleService } from '../../../user/services/sale.service';
import { CustomerService } from '../../../admin/services/customer.service';
import { ProductService } from '../../../admin/services/product.service';
import { ToastService } from '../../../../shared/components/navbar/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AdminProductResponse } from '../../../common/models/product.model';
import { SaleRequest, PaymentMode, SaleResponse } from '../../../common/models/sale.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';

interface BillItem {
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    subtotal: number;
    maxStock: number;
}

@Component({
    selector: 'app-staff-sales',
    standalone: true,
    imports: [CommonModule, FormsModule, LoaderComponent],
    templateUrl: './staff-sales.component.html',
    styleUrls: ['./staff-sales.component.css'],
    animations: [fadeIn]
})
export class StaffSalesComponent implements OnInit {
    private auth = inject(AuthService);
    private saleSvc = inject(SaleService);
    private customerSvc = inject(CustomerService);
    private productSvc = inject(ProductService);
    private toast = inject(ToastService);

    allProducts = signal<AdminProductResponse[]>([]);
    loading = signal(true);
    submitting = signal(false);

    customerForm = { name: '', phone: '', email: '' };
    productSearch = '';
    dropdownOpen = false;
    billItems: BillItem[] = [];

    paymentMode: PaymentMode = 'CASH';
    paymentModes = [
        { value: 'CASH' as PaymentMode, icon: 'bi-cash-stack', label: 'Cash' },
        { value: 'CARD' as PaymentMode, icon: 'bi-credit-card-2-front', label: 'Card' },
        { value: 'UPI' as PaymentMode, icon: 'bi-phone', label: 'UPI' },
        { value: 'CREDIT' as PaymentMode, icon: 'bi-wallet2', label: 'Credit' },
    ];

    completedSale = signal<SaleResponse | null>(null);

    ngOnInit(): void {
        this.productSvc.getAll().subscribe({
            next: p => { this.allProducts.set(p); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    get searchResults(): AdminProductResponse[] {
        const q = this.productSearch.trim().toLowerCase();
        if (!q) return [];
        return this.allProducts()
            .filter(p => p.active && p.availableStock > 0 &&
                (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)))
            .slice(0, 8);
    }

    selectProduct(p: AdminProductResponse): void {
        const existing = this.billItems.find(i => i.productId === p.id);
        if (existing) {
            if (existing.quantity < existing.maxStock) {
                existing.quantity++;
                existing.subtotal = existing.quantity * existing.price;
                this.billItems = [...this.billItems];
            } else {
                this.toast.error(`Max stock reached for ${p.name}`);
            }
        } else {
            this.billItems = [...this.billItems, {
                productId: p.id, productName: p.name, sku: p.sku,
                quantity: 1, price: p.adminToUserPrice,
                subtotal: p.adminToUserPrice, maxStock: p.availableStock
            }];
        }
        this.productSearch = '';
        this.dropdownOpen = false;
    }

    updateQty(item: BillItem, delta: number): void {
        const newQty = item.quantity + delta;
        if (newQty < 1) { this.removeItem(item.productId); return; }
        if (newQty > item.maxStock) { this.toast.error('Exceeds available stock'); return; }
        item.quantity = newQty;
        item.subtotal = newQty * item.price;
        this.billItems = [...this.billItems];
    }

    removeItem(productId: number): void {
        this.billItems = this.billItems.filter(i => i.productId !== productId);
    }

    clearCart(): void { this.billItems = []; }

    get billTotal(): number { return this.billItems.reduce((s, i) => s + i.subtotal, 0); }
    get itemCount(): number { return this.billItems.reduce((s, i) => s + i.quantity, 0); }

    get canSubmit(): boolean {
        return !!this.customerForm.name.trim() &&
            !!this.customerForm.phone.trim() &&
            this.billItems.length > 0 &&
            !this.submitting();
    }

    submitSale(): void {
        if (!this.customerForm.name.trim()) { this.toast.error('Customer name is required'); return; }
        if (!this.customerForm.phone.trim()) { this.toast.error('Customer phone is required'); return; }
        if (this.billItems.length === 0) { this.toast.error('Cart is empty'); return; }
        const user = this.auth.currentUser();
        if (!user) return;

        this.submitting.set(true);
        this.customerSvc.create({
            name: this.customerForm.name.trim(),
            phone: this.customerForm.phone.trim(),
            email: this.customerForm.email.trim() || undefined
        }).subscribe({
            next: c => this.doSale(c.id, user.id),
            error: err => {
                const msg: string = err?.error?.message ?? '';
                if (err?.status === 409 || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('phone')) {
                    this.customerSvc.getByPhone(this.customerForm.phone.trim()).subscribe({
                        next: c => this.doSale(c.id, user.id),
                        error: () => { this.toast.error('Could not resolve customer'); this.submitting.set(false); }
                    });
                } else {
                    this.toast.error(msg || 'Failed to save customer');
                    this.submitting.set(false);
                }
            }
        });
    }

    private doSale(customerId: number, soldById: number): void {
        const req: SaleRequest = {
            soldById, customerId,
            paymentMode: this.paymentMode,
            items: this.billItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
        };
        this.saleSvc.create(req).subscribe({
            next: sale => {
                this.completedSale.set(sale);
                this.billItems = [];
                this.customerForm = { name: '', phone: '', email: '' };
                this.paymentMode = 'CASH';
                this.submitting.set(false);
            },
            error: err => {
                this.toast.error(err?.error?.message ?? 'Sale failed');
                this.submitting.set(false);
            }
        });
    }

    dismissReceipt(): void { this.completedSale.set(null); }
}