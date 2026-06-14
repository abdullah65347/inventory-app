import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { SaleService } from '../../../user/services/sale.service';
import { CustomerService } from '../../../admin/services/customer.service';
import { ProductService } from '../../../admin/services/product.service';
import { CategoryService } from '../../../admin/services/category.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { AdminProductResponse } from '../../../common/models/product.model';
import { CategoryResponse } from '../../../common/models/category.model';
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

const PAGE_SIZE = 10;

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
    private categorySvc = inject(CategoryService);
    private toast = inject(ToastService);

    allProducts = signal<AdminProductResponse[]>([]);
    categories = signal<CategoryResponse[]>([]);
    loading = signal(true);
    submitting = signal(false);

    customerForm = { name: '', phone: '', email: '' };

    // Filters
    search = signal('');
    selectedCategory = signal<string>('ALL');

    showCartModal = false;
    billItems: BillItem[] = [];

    // Lazy loading
    visibleCount = signal(PAGE_SIZE);

    paymentMode: PaymentMode = 'CASH';
    paymentModes = [
        { value: 'CASH' as PaymentMode, icon: 'bi-cash-stack', label: 'Cash' },
        { value: 'CARD' as PaymentMode, icon: 'bi-credit-card-2-front', label: 'Card' },
        { value: 'UPI' as PaymentMode, icon: 'bi-phone', label: 'UPI' },
        { value: 'CREDIT' as PaymentMode, icon: 'bi-wallet2', label: 'Credit' },
    ];

    completedSale = signal<SaleResponse | null>(null);

    /** All filtered products (name, SKU or initials match). */
    filteredProducts = computed<AdminProductResponse[]>(() => {
        const q = this.search().trim().toLowerCase();
        const cat = this.selectedCategory();
        return this.allProducts().filter(p => {
            if (!p.active) return false;
            if (cat !== 'ALL' && p.categoryName !== cat) return false;
            if (!q) return true;
            const name = (p.name ?? '').toLowerCase();
            const sku = (p.sku ?? '').toLowerCase();
            const initials = (p.name ?? '')
                .split(/\s+/).filter(Boolean).map(w => w[0]).join('').toLowerCase();
            return name.includes(q) || sku.includes(q) || initials.startsWith(q);
        });
    });

    /** Slice of filtered products to show (lazy page). Resets on filter change. */
    visibleProducts = computed<AdminProductResponse[]>(() => {
        // Accessing filteredProducts resets visibleCount via setCategory/onSearch
        return this.filteredProducts().slice(0, this.visibleCount());
    });

    hasMore = computed(() => this.visibleCount() < this.filteredProducts().length);

    ngOnInit(): void {
        this.productSvc.getAdminProducts().subscribe({
            next: p => { this.allProducts.set(p); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
        this.categorySvc.getAll().subscribe({
            next: c => this.categories.set(c)
        });
    }

    setCategory(name: string): void {
        this.selectedCategory.set(name);
        this.visibleCount.set(PAGE_SIZE); // reset pagination
    }

    onSearch(value: string): void {
        this.search.set(value);
        this.visibleCount.set(PAGE_SIZE); // reset pagination
    }

    loadMore(): void {
        this.visibleCount.update(n => n + PAGE_SIZE);
    }

    addToCart(p: AdminProductResponse): void {
        if (p.availableStock <= 0) { this.toast.error(`${p.name} is out of stock`); return; }
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

    qtyInCart(productId: number): number {
        return this.billItems.find(i => i.productId === productId)?.quantity ?? 0;
    }

    get billTotal(): number { return this.billItems.reduce((s, i) => s + i.subtotal, 0); }
    get itemCount(): number { return this.billItems.reduce((s, i) => s + i.quantity, 0); }

    get canSubmit(): boolean {
        return !!this.customerForm.name.trim()
            && !!this.customerForm.phone.trim()
            && this.billItems.length > 0
            && !this.submitting();
    }

    submitSale(): void {
        if (!this.customerForm.name.trim()) { this.toast.error('Customer name is required'); return; }
        if (!this.customerForm.phone.trim()) { this.toast.error('Customer phone is required'); return; }
        if (this.billItems.length === 0) { this.toast.error('Cart is empty'); return; }

        const userId = this.auth.userId();
        if (userId == null) { this.toast.error('Session expired. Please log in again.'); return; }

        this.submitting.set(true);
        this.customerSvc.create({
            name: this.customerForm.name.trim(),
            phone: this.customerForm.phone.trim(),
            email: this.customerForm.email.trim() || undefined
        }).subscribe({
            next: c => this.doSale(c.id, userId),
            error: err => {
                const msg: string = err?.error?.message ?? '';
                if (err?.status === 409 || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('phone')) {
                    this.customerSvc.getByPhone(this.customerForm.phone.trim()).subscribe({
                        next: c => this.doSale(c.id, userId),
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
                this.showCartModal = false;
                // Refresh stock counts
                this.productSvc.getAll().subscribe({ next: p => this.allProducts.set(p) });
            },
            error: err => {
                this.toast.error(err?.error?.message ?? 'Sale failed');
                this.submitting.set(false);
            }
        });
    }

    dismissReceipt(): void { this.completedSale.set(null); }

    openCartModal(): void {
        if (this.billItems.length === 0) return;
        this.showCartModal = true;
    }

    closeCartModal(): void {
        this.showCartModal = false;
    }

    printReceipt(): void {
        const receiptEl = document.getElementById('receipt-print');
        if (!receiptEl) return;

        const content = receiptEl.innerHTML;
        const printWindow = window.open('', '_blank', 'width=620,height=820');
        if (!printWindow) return;

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #0f172a; padding: 24px; background: #fff; line-height: 1.5; }
    .receipt-store-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
    .receipt-store-logo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #19535f, #2d7d8a); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .receipt-store-name { font-size: 18px; font-weight: 800; letter-spacing: 1px; }
    .receipt-store-sub { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
    .receipt-meta-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; background: #f8fafc; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }
    .receipt-meta-item { display: flex; flex-direction: column; gap: 3px; }
    .receipt-meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: .6px; font-weight: 700; color: #94a3b8; }
    .receipt-meta-value { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
    .receipt-payment-badge { display: inline-flex; height: 18px; padding: 0 7px; border-radius: 5px; background: #d9eef2; color: #19535f; font-size: 10px; font-weight: 800; align-items: center; }
    .receipt-customer-row { display: flex; align-items: center; gap: 12px; padding: 11px 13px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 16px; }
    .receipt-customer-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #9333ea); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
    .receipt-customer-info { display: flex; flex-direction: column; }
    .receipt-customer-name { font-size: 13px; font-weight: 700; }
    .receipt-customer-phone { font-size: 11px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
    .receipt-customer-label { margin-left: auto; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; font-weight: 700; color: #94a3b8; background: #fff; border: 1px solid #e2e8f0; padding: 3px 7px; border-radius: 5px; }
    .receipt-divider { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #94a3b8; }
    .receipt-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
    .receipt-items-head { display: grid; grid-template-columns: 1fr 60px 90px 90px; padding: 7px 0; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: #94a3b8; border-bottom: 1px solid #e2e8f0; margin-bottom: 2px; }
    .receipt-item-row { display: grid; grid-template-columns: 1fr 60px 90px 90px; align-items: center; padding: 9px 0; border-bottom: 1px dashed #f1f5f9; }
    .receipt-item-row:last-child { border-bottom: none; }
    .receipt-item-name { font-size: 13px; font-weight: 600; display: flex; flex-direction: column; gap: 2px; }
    .receipt-item-dot { display: none; }
    .receipt-item-sku { font-size: 9px; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
    .receipt-item-qty { font-size: 12px; font-weight: 700; color: #475569; text-align: center; }
    .receipt-item-rate { font-size: 12px; color: #475569; text-align: right; font-family: 'JetBrains Mono', monospace; }
    .receipt-item-subtotal { font-size: 13px; font-weight: 800; text-align: right; font-family: 'JetBrains Mono', monospace; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-muted { color: #94a3b8; }
    .receipt-totals { margin-top: 14px; padding-top: 12px; border-top: 1.5px solid #e2e8f0; }
    .receipt-total-row { display: flex; justify-content: space-between; font-size: 12px; color: #475569; padding: 4px 0; }
    .receipt-grand-total { display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; padding-top: 10px; border-top: 2px solid #19535f; }
    .receipt-grand-total span { font-size: 13px; font-weight: 700; }
    .receipt-grand-total strong { font-size: 22px; font-weight: 800; color: #19535f; font-family: 'JetBrains Mono', monospace; }
    .receipt-thankyou { margin-top: 18px; padding: 14px; background: #d9eef2; border-radius: 8px; text-align: center; }
    .receipt-thankyou i { display: none; }
    .receipt-thankyou p { font-size: 13px; font-weight: 700; color: #19535f; margin: 0; }
    .receipt-thankyou span { font-size: 11px; color: #475569; margin-top: 3px; display: block; }
    @page { margin: 14mm; }
  </style>
</head>
<body>${content}</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 400);
        };
    }
}