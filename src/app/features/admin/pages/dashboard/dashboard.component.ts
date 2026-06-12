import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';
import { UserService } from '../../services/user.service';
import { SupplierService } from '../../services/supplier.service';
import { ProductService } from '../../services/product.service';
import { InventoryService } from '../../services/inventory.service';
import { TransactionService } from '../../services/transaction.service';
import { SaleService } from '../../../user/services/sale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { fadeIn, fadeInList } from '../../../../shared/animations/fade.animation';
import { paymentModeBadge } from '../../../../core/utils/role.util';
import { SaleResponse } from '../../../common/models/sale.model';
import { InventoryResponse } from '../../../common/models/inventory.model';
import { TransactionResponse } from '../../../common/models/transaction.model';
import { AppTableComponent } from 'src/app/shared/components/app-table/app-table.component';

Chart.register(...registerables);

export type TimeRange = '15days' | '6months' | 'custom';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoaderComponent, AppTableComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [fadeIn, fadeInList]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('barChart') barRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart') pieRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productPieChart') productPieRef!: ElementRef<HTMLCanvasElement>;

  auth = inject(AuthService);
  private userSvc = inject(UserService);
  private supSvc = inject(SupplierService);
  private prodSvc = inject(ProductService);
  private invSvc = inject(InventoryService);
  private txSvc = inject(TransactionService);
  private saleSvc = inject(SaleService);

  loading = signal(true);
  recentSales = signal<SaleResponse[]>([]);
  lowStock = signal<InventoryResponse[]>([]);
  maxDate = signal(this.formatDateInput(new Date()));

  stats = signal({
    users: 0, suppliers: 0, products: 0,
    revenue: 0, sales: 0, lowStock: 0
  });

  selectedRange = signal<TimeRange>('6months');

  // Custom date range (ISO strings yyyy-mm-dd for input[type=date])
  customFrom = signal<string>(this.formatDateInput(new Date(Date.now() - 30 * 86400000)));
  customTo = signal<string>(this.formatDateInput(new Date()));
  customError = signal<string>('');

  paymentModeBadge = paymentModeBadge;

  private salesData: SaleResponse[] = [];
  private txData: TransactionResponse[] = [];
  private prodData: any[] = [];

  chartsReady = false;
  dataLoaded = false;
  private chartInstances: any[] = [];

  readonly timeRanges: { label: string; value: TimeRange }[] = [
    { label: 'Last 15 Days', value: '15days' },
    { label: 'Last 6 Months', value: '6months' },
    { label: 'Custom Range', value: 'custom' }
  ];

  ngOnInit(): void {
    forkJoin({
      users: this.userSvc.getAll().pipe(catchError(() => of([]))),
      suppliers: this.supSvc.getAll().pipe(catchError(() => of([]))),
      products: this.prodSvc.getAdminProducts().pipe(catchError(() => of([]))),
      sales: this.saleSvc.getAll().pipe(catchError(() => of([]))),
      inventory: this.invSvc.getAll().pipe(catchError(() => of([]))),
      txs: this.txSvc.getAll().pipe(catchError(() => of([])))
    }).subscribe(({ users, suppliers, products, sales, inventory, txs }) => {

      const lowStockItems = (inventory as InventoryResponse[])
        .filter(item => item.availableStock <= item.reorderLevel);

      const totalRevenue = (sales as SaleResponse[])
        .reduce((sum, sale) => sum + sale.totalAmount, 0);

      this.stats.set({
        users: users.length,
        suppliers: suppliers.length,
        products: products.length,
        revenue: totalRevenue,
        sales: sales.length,
        lowStock: lowStockItems.length
      });

      this.recentSales.set([...(sales as SaleResponse[])].reverse().slice(0, 5));
      this.lowStock.set(lowStockItems.slice(0, 5));

      this.salesData = sales as SaleResponse[];
      this.txData = txs as TransactionResponse[];
      this.prodData = products as any[];

      this.loading.set(false);
      this.dataLoaded = true;

      if (this.chartsReady) this.renderCharts();
    });
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (this.dataLoaded) this.renderCharts();
  }

  // ─────────────────────────────────────────────────────────
  // TIME RANGE HANDLERS
  // ─────────────────────────────────────────────────────────

  setRange(range: TimeRange): void {
    this.selectedRange.set(range);
    this.customError.set('');
    if (range !== 'custom') {
      this.renderCharts();
    } else {
      // render immediately with current custom values if valid
      if (this.isCustomValid()) this.renderCharts();
    }
  }

  onCustomFromChange(value: string): void {
    this.customFrom.set(value);
    this.applyCustom();
  }

  onCustomToChange(value: string): void {
    this.customTo.set(value);
    this.applyCustom();
  }

  applyCustom(): void {
    if (this.selectedRange() !== 'custom') return;
    if (!this.isCustomValid()) return;
    this.customError.set('');
    this.renderCharts();
  }

  private isCustomValid(): boolean {
    const from = this.customFrom();
    const to = this.customTo();
    if (!from || !to) {
      this.customError.set('Please select both dates');
      return false;
    }
    if (new Date(from) > new Date(to)) {
      this.customError.set('"From" date cannot be after "To" date');
      return false;
    }
    return true;
  }

  private formatDateInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  rangeLabel(): string {
    const r = this.selectedRange();
    if (r === '15days') return 'Last 15 Days';
    if (r === '6months') return 'Last 6 Months';
    return `${this.customFrom()}  →  ${this.customTo()}`;
  }

  // ─────────────────────────────────────────────────────────
  // BUILD PERIOD BUCKETS
  // ─────────────────────────────────────────────────────────

  private buildBuckets(): { label: string; start: Date; end: Date }[] {
    const now = new Date();
    const range = this.selectedRange();

    if (range === '15days') {
      return this.dailyBuckets(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14),
        new Date(now.getFullYear(), now.getMonth(), now.getDate())
      );
    }

    if (range === '6months') {
      const buckets = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        buckets.push({
          label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
          start, end
        });
      }
      return buckets;
    }

    // CUSTOM
    const from = new Date(this.customFrom());
    const to = new Date(this.customTo());
    const diffDays = Math.floor((to.getTime() - from.getTime()) / 86400000) + 1;

    if (diffDays <= 31) {
      // daily buckets
      return this.dailyBuckets(from, to);
    }

    if (diffDays <= 120) {
      // weekly buckets
      return this.weeklyBuckets(from, to);
    }

    // monthly buckets
    return this.monthlyBuckets(from, to);
  }

  private dailyBuckets(from: Date, to: Date) {
    const buckets = [];
    const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const last = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    while (cur <= last) {
      const start = new Date(cur); start.setHours(0, 0, 0, 0);
      const end = new Date(cur); end.setHours(23, 59, 59, 999);
      buckets.push({
        label: cur.toLocaleString('default', { month: 'short', day: 'numeric' }),
        start, end
      });
      cur.setDate(cur.getDate() + 1);
    }
    return buckets;
  }

  private weeklyBuckets(from: Date, to: Date) {
    const buckets = [];
    const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const last = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
    while (cur <= last) {
      const start = new Date(cur); start.setHours(0, 0, 0, 0);
      const end = new Date(cur); end.setDate(end.getDate() + 6); end.setHours(23, 59, 59, 999);
      if (end > last) end.setTime(last.getTime());
      buckets.push({
        label: start.toLocaleString('default', { month: 'short', day: 'numeric' }),
        start, end: new Date(end)
      });
      cur.setDate(cur.getDate() + 7);
    }
    return buckets;
  }

  private monthlyBuckets(from: Date, to: Date) {
    const buckets = [];
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    const last = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cur <= last) {
      const start = new Date(cur.getFullYear(), cur.getMonth(), 1);
      const end = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
      buckets.push({
        label: cur.toLocaleString('default', { month: 'short', year: '2-digit' }),
        start, end
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return buckets;
  }

  private xMaxRotation(): number {
    const buckets = this.buildBuckets();
    return buckets.length > 10 ? 45 : 0;
  }

  // ─────────────────────────────────────────────────────────
  // RENDER ALL CHARTS
  // ─────────────────────────────────────────────────────────

  renderCharts(): void {
    setTimeout(() => {
      this.renderBarChart();
      this.renderPieChart();
      this.renderLineChart();
      this.renderProductPieChart();
    }, 150);
  }

  renderBarChart(): void {
    if (!this.barRef) return;
    const ctx = this.barRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const buckets = this.buildBuckets();
    const labels: string[] = buckets.map(b => b.label);
    const revenues: number[] = [];
    const orders: number[] = [];

    for (const bucket of buckets) {
      const monthSales = this.salesData.filter(sale => {
        const d = new Date(sale.saleDate);
        return d >= bucket.start && d <= bucket.end;
      });
      revenues.push(monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0));
      orders.push(monthSales.length);
    }

    this.destroyChart('bar');

    const palette1 = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af'];
    const palette2 = ['#10b981', '#34d399', '#6ee7b7', '#059669', '#047857', '#065f46'];

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue (₹)',
            data: revenues,
            backgroundColor: labels.map((_, i) => palette1[i % palette1.length]),
            borderRadius: 10,
            borderSkipped: false,
            yAxisID: 'y'
          },
          {
            label: 'Orders',
            data: orders,
            backgroundColor: labels.map((_, i) => palette2[i % palette2.length]),
            borderRadius: 10,
            borderSkipped: false,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#64748b', usePointStyle: true, pointStyle: 'circle' } },
          tooltip: {
            callbacks: {
              label: (ctx: any) =>
                ctx.datasetIndex === 0
                  ? ` ₹${ctx.raw.toLocaleString('en-IN')}`
                  : ` ${ctx.raw} Orders`
            }
          }
        },
        scales: {
          y: {
            position: 'left',
            grid: { color: '#e2e8f0' },
            ticks: { color: '#94a3b8', callback: (v: any) => '₹' + v.toLocaleString('en-IN') }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#94a3b8' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', maxRotation: this.xMaxRotation() }
          }
        }
      }
    });

    this.chartInstances.push({ key: 'bar', instance: chart });
  }

  renderPieChart(): void {
    if (!this.pieRef) return;
    const ctx = this.pieRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const buckets = this.buildBuckets();
    const labels: string[] = buckets.map(b => b.label);
    const saleValues: number[] = [];
    const purchaseValues: number[] = [];

    for (const bucket of buckets) {
      const bucketSales = this.salesData.filter(sale => {
        const d = new Date(sale.saleDate);
        return d >= bucket.start && d <= bucket.end;
      });
      saleValues.push(bucketSales.reduce((sum, sale) => sum + sale.totalAmount, 0));

      const bucketStockIn = this.txData.filter(tx => {
        const d = new Date(tx.createdAt);
        return tx.transactionType === 'STOCK_IN' && d >= bucket.start && d <= bucket.end;
      });
      const purchaseTotal = bucketStockIn.reduce((sum, tx) => {
        const product = this.prodData.find(p => p.id === tx.productId);
        const costPrice = product?.supplierToAdminPrice ?? 0;
        return sum + tx.quantity * costPrice;
      }, 0);
      purchaseValues.push(purchaseTotal);
    }

    this.destroyChart('pie');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Sale Value (₹)',
            data: saleValues,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#7c3aed',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
            yAxisID: 'y'
          },
          {
            label: 'Purchase Cost (₹)',
            data: purchaseValues,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.10)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#f59e0b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            borderWidth: 3,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#64748b', usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const profit = saleValues[ctx.dataIndex] - purchaseValues[ctx.dataIndex];
                const extra = ctx.datasetIndex === 0
                  ? `  |  Profit: ₹${profit.toLocaleString('en-IN')}`
                  : '';
                return ` ₹${(ctx.raw as number).toLocaleString('en-IN')}${extra}`;
              },
              afterBody: (items: any[]) => {
                if (items.length === 2) {
                  const profit = saleValues[items[0].dataIndex] - purchaseValues[items[0].dataIndex];
                  const margin = saleValues[items[0].dataIndex] > 0
                    ? ((profit / saleValues[items[0].dataIndex]) * 100).toFixed(1)
                    : '0';
                  return [
                    `─────────────`,
                    `Net Profit: ₹${profit.toLocaleString('en-IN')} (${margin}%)`
                  ];
                }
                return [];
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: '#e2e8f0' },
            ticks: {
              color: '#94a3b8',
              callback: (v: any) => '₹' + v.toLocaleString('en-IN')
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', maxRotation: this.xMaxRotation() }
          }
        }
      }
    });

    this.chartInstances.push({ key: 'pie', instance: chart });
  }

  renderLineChart(): void {
    if (!this.lineRef) return;
    const ctx = this.lineRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const buckets = this.buildBuckets();
    const labels: string[] = buckets.map(b => b.label);
    const stockIn: number[] = [];
    const stockOut: number[] = [];

    for (const bucket of buckets) {
      const monthlyTx = this.txData.filter(tx => {
        const d = new Date(tx.createdAt);
        return d >= bucket.start && d <= bucket.end;
      });
      stockIn.push(monthlyTx.filter(tx => tx.transactionType === 'STOCK_IN').reduce((s, t) => s + t.quantity, 0));
      stockOut.push(monthlyTx.filter(tx => tx.transactionType === 'STOCK_OUT').reduce((s, t) => s + t.quantity, 0));
    }

    this.destroyChart('line');

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Stock In', data: stockIn,
            borderColor: '#14b8a6', backgroundColor: 'rgba(20,184,166,0.15)',
            fill: true, tension: 0.4,
            pointRadius: 5, pointHoverRadius: 7,
            pointBackgroundColor: '#14b8a6', pointBorderColor: '#fff', pointBorderWidth: 2,
            borderWidth: 3
          },
          {
            label: 'Stock Out', data: stockOut,
            borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.12)',
            fill: true, tension: 0.4,
            pointRadius: 5, pointHoverRadius: 7,
            pointBackgroundColor: '#f43f5e', pointBorderColor: '#fff', pointBorderWidth: 2,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#64748b', usePointStyle: true, pointStyle: 'circle' } },
          tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw} Units` } }
        },
        scales: {
          y: { grid: { color: '#e2e8f0' }, ticks: { color: '#94a3b8' } },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', maxRotation: this.xMaxRotation() }
          }
        }
      }
    });

    this.chartInstances.push({ key: 'line', instance: chart });
  }

  renderProductPieChart(): void {
    if (!this.productPieRef) return;
    const ctx = this.productPieRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Aggregate revenue per product from salesData
    const revenueMap: Record<number, { name: string; revenue: number }> = {};

    for (const sale of this.salesData) {
      // sale items are not directly on SaleResponse — use txData as proxy via prodData
    }

    // Build revenue map from sale_items via salesData if your SaleResponse includes items,
    // otherwise derive from prodData x salesData totals grouped by product
    // Adjust depending on your SaleResponse shape:
    const productRevenue: { name: string; revenue: number }[] = this.prodData.map(p => {
      const rev = this.salesData
        .flatMap((s: any) => s.items ?? s.saleItems ?? [])
        .filter((item: any) => item.productId === p.id)
        .reduce((sum: number, item: any) => sum + (item.subtotal ?? item.price * item.quantity), 0);
      return { name: p.name, revenue: rev };
    }).filter(p => p.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const labels = productRevenue.map(p => p.name);
    const data = productRevenue.map(p => p.revenue);

    const colors = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];
    const hoverColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f97316', '#ec4899'];

    this.destroyChart('productPie');

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          hoverBackgroundColor: hoverColors,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#64748b',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 18,
              font: { size: 13 },
              generateLabels: (chart) => {
                const ds = chart.data.datasets[0];
                return (chart.data.labels as string[]).map((label, i) => ({
                  text: label.length > 18 ? label.slice(0, 16) + '…' : label,
                  fillStyle: (ds.backgroundColor as string[])[i],
                  strokeStyle: (ds.backgroundColor as string[])[i],
                  pointStyle: 'circle' as const,
                  hidden: false,
                  index: i
                }));
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) =>
                `  ₹${(ctx.raw as number).toLocaleString('en-IN')}`
            }
          }
        }
      }
    });

    this.chartInstances.push({ key: 'productPie', instance: chart });
  }

  private destroyChart(key: string): void {
    const existing = this.chartInstances.find(c => c.key === key);
    if (existing) {
      existing.instance.destroy();
      this.chartInstances = this.chartInstances.filter(c => c.key !== key);
    }
  }
}
