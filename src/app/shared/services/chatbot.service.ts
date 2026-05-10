import { Injectable, inject } from '@angular/core';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { InventoryService } from '../../features/admin/services/inventory.service';
import { SaleService } from '../../features/user/services/sale.service';
import { PurchaseService } from '../../features/admin/services/purchase.service';
import { ProductService } from '../../features/admin/services/product.service';
import { ManagerService } from '../../features/admin/services/manager.service';
import { StaffService } from '../../features/admin/services/staff.service';
import { CustomerService } from '../../features/admin/services/customer.service';
import { ROLES } from '../constants/roles.constant';

export interface ChatMessage {
    id: string;
    from: 'user' | 'bot';
    text: string;
    time: Date;
    cards?: ChatCard[];
}

export interface ChatCard {
    label: string;
    value: string;
    color?: string;
    icon?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
    private auth = inject(AuthService);
    private invSvc = inject(InventoryService);
    private saleSvc = inject(SaleService);
    private purchaseSvc = inject(PurchaseService);
    private productSvc = inject(ProductService);
    private managerSvc = inject(ManagerService);
    private staffSvc = inject(StaffService);
    private customerSvc = inject(CustomerService);

    private get role(): string { return this.auth.getRole() ?? ''; }
    private get user() { return this.auth.currentUser(); }

    // ─── MAIN ENTRY POINT ───────────────────────────────────────────────────────
    processMessage(input: string): Observable<ChatMessage> {
        const text = input.trim().toLowerCase();
        const id = Date.now().toString();

        // greeting
        if (this.matches(text, ['hi', 'hello', 'hey', 'good morning', 'good evening', 'sup'])) {
            return of(this.textMsg(id, this.greeting()));
        }

        // help
        if (this.matches(text, ['help', 'what can you do', 'commands', 'options', 'features'])) {
            return of(this.textMsg(id, this.helpText()));
        }

        // low stock
        if (this.matches(text, ['low stock', 'reorder', 'running out', 'below reorder', 'stock alert', 'low inventory'])) {
            return this.lowStockResponse(id);
        }

        // inventory / stock
        if (this.matches(text, ['inventory', 'all stock', 'stock levels', 'total stock', 'stock status'])) {
            return this.inventoryResponse(id);
        }

        // specific product stock
        if (this.matches(text, ['stock of', 'how many', 'quantity of', 'available stock for', 'check stock'])) {
            return this.productStockResponse(id, text);
        }

        // sales today
        if (this.matches(text, ['sales today', 'today sales', 'today revenue', 'revenue today', 'how much today', 'sold today'])) {
            return this.salesTodayResponse(id);
        }

        // total sales
        if (this.matches(text, ['total sales', 'all sales', 'sales count', 'sales history', 'sale summary'])) {
            return this.totalSalesResponse(id);
        }

        // pending purchases / orders
        if (this.matches(text, ['pending order', 'pending purchase', 'pending delivery', 'orders pending', 'open orders'])) {
            return this.pendingPurchasesResponse(id);
        }

        // delivered purchases (waiting confirm)
        if (this.matches(text, ['delivered', 'waiting confirm', 'confirm delivery', 'need confirmation', 'unconfirmed'])) {
            return this.deliveredPurchasesResponse(id);
        }

        // products
        if (this.matches(text, ['products', 'all products', 'product list', 'available products', 'show products'])) {
            return this.productsResponse(id);
        }

        // managers (admin only)
        if (this.matches(text, ['managers', 'how many managers', 'manager count', 'manager list'])) {
            return this.managersResponse(id);
        }

        // staff
        if (this.matches(text, ['staff', 'how many staff', 'staff count', 'my staff', 'staff list'])) {
            return this.staffResponse(id);
        }

        // customers
        if (this.matches(text, ['customers', 'customer count', 'total customers', 'how many customers'])) {
            return this.customersResponse(id);
        }

        // my sales (staff / manager)
        if (this.matches(text, ['my sales', 'my revenue', 'my performance', 'my total', 'what have i sold'])) {
            return this.mySalesResponse(id);
        }

        // top products
        if (this.matches(text, ['top product', 'best selling', 'most sold', 'popular product'])) {
            return this.topProductsResponse(id);
        }

        // dashboard summary
        if (this.matches(text, ['summary', 'overview', 'dashboard', 'quick stats', 'status'])) {
            return this.summaryResponse(id);
        }

        // fallback
        return of(this.textMsg(id,
            `I didn't quite get that. Type **help** to see what I can answer. 🤔`
        ));
    }

    // ─── RESPONSES ──────────────────────────────────────────────────────────────

    private lowStockResponse(id: string): Observable<ChatMessage> {
        return this.invSvc.getLowStock().pipe(
            map(items => {
                if (items.length === 0)
                    return this.textMsg(id, '✅ All products are well-stocked! No items below reorder level.');

                const cards: ChatCard[] = items.slice(0, 6).map(i => ({
                    label: i.productName,
                    value: `${i.availableStock} left (min: ${i.reorderLevel})`,
                    color: i.availableStock === 0 ? 'danger' : 'warning',
                    icon: i.availableStock === 0 ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'
                }));

                return {
                    id, from: 'bot' as const, time: new Date(),
                    text: `⚠️ **${items.length} product${items.length > 1 ? 's' : ''}** below reorder level:`,
                    cards
                };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private inventoryResponse(id: string): Observable<ChatMessage> {
        return this.invSvc.getAll().pipe(
            map(items => {
                const total = items.reduce((s, i) => s + i.availableStock, 0);
                const lowCount = items.filter(i => i.availableStock <= i.reorderLevel).length;
                const cards: ChatCard[] = [
                    { label: 'Total Products', value: `${items.length}`, color: 'primary', icon: 'bi-box-seam-fill' },
                    { label: 'Total Units', value: `${total}`, color: 'success', icon: 'bi-archive-fill' },
                    { label: 'Low Stock Items', value: `${lowCount}`, color: lowCount > 0 ? 'warning' : 'success', icon: 'bi-exclamation-triangle-fill' },
                ];
                return { id, from: 'bot' as const, time: new Date(), text: '📦 **Inventory Overview:**', cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private productStockResponse(id: string, text: string): Observable<ChatMessage> {
        return this.invSvc.getAll().pipe(
            map(items => {
                // extract possible product name from the query
                const keywords = text
                    .replace(/stock of|how many|quantity of|available stock for|check stock/g, '')
                    .trim().split(' ').filter(w => w.length > 2);

                const matches = items.filter(i =>
                    keywords.some(k => i.productName.toLowerCase().includes(k) || i.sku.toLowerCase().includes(k))
                );

                if (matches.length === 0)
                    return this.textMsg(id, `I couldn't find a product matching that name. Try "stock of laptop" or "how many shirts".`);

                const cards: ChatCard[] = matches.slice(0, 5).map(i => ({
                    label: i.productName,
                    value: `${i.availableStock} units (SKU: ${i.sku})`,
                    color: i.availableStock <= i.reorderLevel ? 'warning' : 'success',
                    icon: 'bi-boxes'
                }));

                return { id, from: 'bot' as const, time: new Date(), text: `🔍 Found **${matches.length}** match(es):`, cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private salesTodayResponse(id: string): Observable<ChatMessage> {
        const obs = this.role === ROLES.STAFF && this.user
            ? this.saleSvc.getBySoldBy(this.user.id)
            : this.saleSvc.getAll();

        return obs.pipe(
            map(sales => {
                const today = new Date().toDateString();
                const todaySales = sales.filter(s => new Date(s.saleDate).toDateString() === today);
                const revenue = todaySales.reduce((s, sale) => s + sale.totalAmount, 0);

                const cards: ChatCard[] = [
                    { label: 'Sales Today', value: `${todaySales.length}`, color: 'primary', icon: 'bi-receipt-cutoff' },
                    { label: 'Revenue Today', value: `₹${revenue.toLocaleString('en-IN')}`, color: 'success', icon: 'bi-currency-rupee' },
                ];

                const prefix = this.role === ROLES.STAFF ? 'Your' : 'Total';
                return { id, from: 'bot' as const, time: new Date(), text: `📊 **${prefix} sales today:**`, cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private totalSalesResponse(id: string): Observable<ChatMessage> {
        const obs = this.role === ROLES.STAFF && this.user
            ? this.saleSvc.getBySoldBy(this.user.id)
            : this.saleSvc.getAll();

        return obs.pipe(
            map(sales => {
                const revenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
                const cashSales = sales.filter(s => s.paymentMode === 'CASH').length;
                const cardSales = sales.filter(s => s.paymentMode === 'CARD').length;
                const upiSales = sales.filter(s => s.paymentMode === 'UPI').length;
                const creditSales = sales.filter(s => s.paymentMode === 'CREDIT').length;

                const cards: ChatCard[] = [
                    { label: 'Total Sales', value: `${sales.length}`, color: 'primary', icon: 'bi-receipt' },
                    { label: 'Total Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, color: 'success', icon: 'bi-currency-rupee' },
                    { label: 'Cash', value: `${cashSales}`, color: 'success', icon: 'bi-cash' },
                    { label: 'UPI', value: `${upiSales}`, color: 'primary', icon: 'bi-phone' },
                    { label: 'Card', value: `${cardSales}`, color: 'warning', icon: 'bi-credit-card' },
                    { label: 'Credit', value: `${creditSales}`, color: 'danger', icon: 'bi-clock-history' },
                ];

                return { id, from: 'bot' as const, time: new Date(), text: `💰 **Sales Summary:**`, cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private pendingPurchasesResponse(id: string): Observable<ChatMessage> {
        return this.purchaseSvc.getByStatus('PENDING').pipe(
            map(purchases => {
                if (purchases.length === 0)
                    return this.textMsg(id, '✅ No pending purchase orders right now.');

                const total = purchases.reduce((s, p) => s + p.totalAmount, 0);
                const cards: ChatCard[] = [
                    { label: 'Pending Orders', value: `${purchases.length}`, color: 'warning', icon: 'bi-cart-check-fill' },
                    { label: 'Total Value', value: `₹${total.toLocaleString('en-IN')}`, color: 'primary', icon: 'bi-currency-rupee' },
                ];

                return { id, from: 'bot' as const, time: new Date(), text: `🛒 **Pending purchase orders:**`, cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private deliveredPurchasesResponse(id: string): Observable<ChatMessage> {
        return this.purchaseSvc.getByStatus('DELIVERED').pipe(
            map(purchases => {
                if (purchases.length === 0)
                    return this.textMsg(id, '✅ No deliveries waiting for confirmation.');

                const cards: ChatCard[] = purchases.slice(0, 5).map(p => ({
                    label: `Order #${p.id}`,
                    value: `₹${p.totalAmount.toLocaleString('en-IN')} — ${p.items.length} item(s)`,
                    color: 'warning',
                    icon: 'bi-truck'
                }));

                return {
                    id, from: 'bot' as const, time: new Date(),
                    text: `📬 **${purchases.length} delivered order(s)** waiting for confirmation:`,
                    cards
                };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private productsResponse(id: string): Observable<ChatMessage> {
        return this.productSvc.getAll().pipe(
            map(products => {
                const active = products.filter((p: any) => p.active).length;
                const cards: ChatCard[] = [
                    { label: 'Total Products', value: `${products.length}`, color: 'primary', icon: 'bi-box-seam-fill' },
                    { label: 'Active Products', value: `${active}`, color: 'success', icon: 'bi-check-circle-fill' },
                    { label: 'Inactive', value: `${products.length - active}`, color: 'muted', icon: 'bi-pause-circle' },
                ];
                return { id, from: 'bot' as const, time: new Date(), text: '📦 **Product Catalog:**', cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private managersResponse(id: string): Observable<ChatMessage> {
        if (this.role !== ROLES.ADMIN)
            return of(this.textMsg(id, '🔒 Manager info is only available to admins.'));

        return this.managerSvc.getAll().pipe(
            map(managers => {
                const active = managers.filter(m => m.active).length;
                const cards: ChatCard[] = [
                    { label: 'Total Managers', value: `${managers.length}`, color: 'warning', icon: 'bi-person-badge-fill' },
                    { label: 'Active', value: `${active}`, color: 'success', icon: 'bi-check-circle-fill' },
                ];
                return { id, from: 'bot' as const, time: new Date(), text: '👔 **Manager Overview:**', cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private staffResponse(id: string): Observable<ChatMessage> {

        if (this.role === ROLES.MANAGER && this.user) {

            return this.managerSvc.getByUser(this.user.id).pipe(

                switchMap(manager => {
                    return this.staffSvc.getByManager(manager.id);
                }),

                map(staff => {
                    const active = staff.filter(s => s.active).length;

                    const cards: ChatCard[] = [
                        {
                            label: 'Total Staff',
                            value: `${staff.length}`,
                            color: 'primary',
                            icon: 'bi-person-lines-fill'
                        },
                        {
                            label: 'Active Staff',
                            value: `${active}`,
                            color: 'success',
                            icon: 'bi-check-circle-fill'
                        },
                    ];

                    return {
                        id,
                        from: 'bot' as const,
                        time: new Date(),
                        text: `👥 **My Staff Team:**`,
                        cards
                    };
                }),

                catchError(() => of(this.errMsg(id)))
            );
        }

        return this.staffSvc.getAll().pipe(

            map(staff => {

                const active = staff.filter(s => s.active).length;

                const cards: ChatCard[] = [
                    {
                        label: 'Total Staff',
                        value: `${staff.length}`,
                        color: 'primary',
                        icon: 'bi-person-lines-fill'
                    },
                    {
                        label: 'Active Staff',
                        value: `${active}`,
                        color: 'success',
                        icon: 'bi-check-circle-fill'
                    },
                ];

                return {
                    id,
                    from: 'bot' as const,
                    time: new Date(),
                    text: `👥 **All Staff:**`,
                    cards
                };
            }),

            catchError(() => of(this.errMsg(id)))
        );
    }

    private customersResponse(id: string): Observable<ChatMessage> {
        return this.customerSvc.getAll().pipe(
            map(customers => {
                const cards: ChatCard[] = [
                    { label: 'Total Customers', value: `${customers.length}`, color: 'accent', icon: 'bi-people-fill' },
                ];
                return { id, from: 'bot' as const, time: new Date(), text: '🧑‍🤝‍🧑 **Customer Base:**', cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private mySalesResponse(id: string): Observable<ChatMessage> {
        const user = this.user;
        if (!user) return of(this.textMsg(id, 'Could not determine current user.'));

        return this.saleSvc.getBySoldBy(user.id).pipe(
            map(sales => {
                const revenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
                const today = new Date().toDateString();
                const todaySales = sales.filter(s => new Date(s.saleDate).toDateString() === today);

                const cards: ChatCard[] = [
                    { label: 'All Time Sales', value: `${sales.length}`, color: 'primary', icon: 'bi-receipt' },
                    { label: 'Total Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, color: 'success', icon: 'bi-currency-rupee' },
                    { label: 'Sales Today', value: `${todaySales.length}`, color: 'warning', icon: 'bi-calendar-check' },
                ];

                return { id, from: 'bot' as const, time: new Date(), text: `📈 **Your Performance:**`, cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private topProductsResponse(id: string): Observable<ChatMessage> {
        return this.saleSvc.getAll().pipe(
            map(sales => {
                const countMap: Record<number, { name: string; qty: number }> = {};
                sales.forEach(sale => {
                    sale.items.forEach(item => {
                        if (!countMap[item.productId])
                            countMap[item.productId] = { name: item.productName, qty: 0 };
                        countMap[item.productId].qty += item.quantity;
                    });
                });

                const sorted = Object.values(countMap)
                    .sort((a, b) => b.qty - a.qty)
                    .slice(0, 5);

                if (sorted.length === 0)
                    return this.textMsg(id, 'No sales data yet to determine top products.');

                const cards: ChatCard[] = sorted.map((p, i) => ({
                    label: `#${i + 1} ${p.name}`,
                    value: `${p.qty} units sold`,
                    color: i === 0 ? 'warning' : 'primary',
                    icon: i === 0 ? 'bi-trophy-fill' : 'bi-bar-chart-fill'
                }));

                return { id, from: 'bot' as const, time: new Date(), text: '🏆 **Top Selling Products:**', cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    private summaryResponse(id: string): Observable<ChatMessage> {
        return forkJoin({
            inventory: this.invSvc.getAll().pipe(catchError(() => of([]))),
            sales: this.saleSvc.getAll().pipe(catchError(() => of([]))),
            purchases: this.purchaseSvc.getAll().pipe(catchError(() => of([]))),
        }).pipe(
            map(({ inventory, sales, purchases }) => {
                const today = new Date().toDateString();
                const todaySales = (sales as any[]).filter((s: any) => new Date(s.saleDate).toDateString() === today);
                const todayRevenue = todaySales.reduce((s: number, sale: any) => s + sale.totalAmount, 0);
                const lowStock = (inventory as any[]).filter((i: any) => i.availableStock <= i.reorderLevel).length;
                const pending = (purchases as any[]).filter((p: any) => p.status === 'PENDING').length;
                const delivered = (purchases as any[]).filter((p: any) => p.status === 'DELIVERED').length;

                const cards: ChatCard[] = [
                    { label: 'Sales Today', value: `${todaySales.length}`, color: 'primary', icon: 'bi-receipt-cutoff' },
                    { label: 'Revenue Today', value: `₹${todayRevenue.toLocaleString('en-IN')}`, color: 'success', icon: 'bi-currency-rupee' },
                    { label: 'Low Stock Alerts', value: `${lowStock}`, color: lowStock > 0 ? 'warning' : 'success', icon: 'bi-exclamation-triangle-fill' },
                    { label: 'Pending Orders', value: `${pending}`, color: pending > 0 ? 'warning' : 'success', icon: 'bi-cart-check-fill' },
                    { label: 'Awaiting Confirm', value: `${delivered}`, color: delivered > 0 ? 'warning' : 'success', icon: 'bi-truck' },
                ];

                return { id, from: 'bot' as const, time: new Date(), text: '📋 **System Overview:**', cards };
            }),
            catchError(() => of(this.errMsg(id)))
        );
    }

    // ─── HELPERS ────────────────────────────────────────────────────────────────

    private matches(text: string, keywords: string[]): boolean {
        return keywords.some(k => text.includes(k));
    }

    private textMsg(id: string, text: string): ChatMessage {
        return { id, from: 'bot', text, time: new Date() };
    }

    private errMsg(id: string): ChatMessage {
        return { id, from: 'bot', text: '❌ Failed to fetch data. Please try again.', time: new Date() };
    }

    private greeting(): string {
        const hour = new Date().getHours();
        const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const name = this.user?.name?.split(' ')[0] ?? '';
        return `${time}${name ? ', ' + name : ''}! 👋 I'm your Inventra assistant. Type **help** to see what I can do.`;
    }

    private helpText(): string {
        const role = this.role;
        const common = [
            '📦 **inventory** — stock levels overview',
            '⚠️ **low stock** — products below reorder level',
            '🔍 **stock of [product]** — specific product stock',
            '📊 **sales today** — today\'s sales & revenue',
            '💰 **total sales** — all-time sales summary',
            '🏆 **top products** — best selling items',
            '🧑‍🤝‍🧑 **customers** — customer count',
            '📋 **summary** — full system overview',
        ];

        const adminExtra = [
            '🛒 **pending orders** — open purchase orders',
            '📬 **delivered** — orders waiting confirmation',
            '👔 **managers** — manager overview',
            '👥 **staff** — staff overview',
        ];

        const staffExtra = [
            '📈 **my sales** — your personal performance',
            '📦 **products** — available products to sell',
        ];

        let lines = common;
        if (role === ROLES.ADMIN || role === ROLES.MANAGER) lines = [...common, ...adminExtra];
        if (role === ROLES.STAFF) lines = [...common, ...staffExtra];

        return `Here's what I can help with:\n\n${lines.join('\n')}`;
    }

    getSuggestedQuestions(): string[] {
        const role = this.role;
        if (role === ROLES.ADMIN) return ['Summary', 'Low stock', 'Pending orders', 'Total sales', 'Managers'];
        if (role === ROLES.MANAGER) return ['Summary', 'Delivered', 'My staff', 'Sales today', 'Low stock'];
        if (role === ROLES.STAFF) return ['My sales', 'Sales today', 'Low stock', 'Products', 'Customers'];
        if (role === ROLES.SUPPLIER) return ['Pending orders', 'Delivered', 'Low stock', 'Summary'];
        return ['Summary', 'Low stock', 'Sales today'];
    }
}