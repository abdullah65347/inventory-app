import { Component, OnInit, inject, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { SupplierService } from '../../../admin/services/supplier.service';
import { SupplierProductService } from '../../services/supplier-product.service';
import { SupplierOrderService } from '../../services/supplier-order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PurchaseResponse } from '../../../common/models/purchase.model';
import { SupplierProductResponse } from '../../../common/models/product.model';
import { statusBadge } from '../../../../core/utils/role.util';
import { fadeIn, fadeInList } from '../../../../shared/animations/fade.animation';

Chart.register(...registerables);

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  templateUrl: './supplier-dashboard.component.html',
  styleUrls: ['./supplier-dashboard.component.css'],
  animations: [fadeIn, fadeInList]
})
export class SupplierDashboardComponent implements OnInit, AfterViewInit {

  @ViewChild('barChart') barRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart') donutRef!: ElementRef<HTMLCanvasElement>;

  auth = inject(AuthService);
  supplierSvc = inject(SupplierService);
  productSvc = inject(SupplierProductService);
  orderSvc = inject(SupplierOrderService);

  loading = signal(true);
  supplierId = signal(0);
  products = signal<SupplierProductResponse[]>([]);
  orders = signal<PurchaseResponse[]>([]);

  stats = signal({
    products: 0,
    stock: 0,
    pending: 0,
    delivered: 0,
    confirmed: 0,
    totalRevenue: 0
  });

  recentOrders = signal<PurchaseResponse[]>([]);

  chartsReady = false;
  dataLoaded = false;
  statusBadge = statusBadge;

  private chartInstances: { key: string; instance: any }[] = [];

  ngOnInit(): void {
    const loadDashboard = (userId: number) => {
      this.supplierSvc.getByUser(userId).subscribe({
        next: s => {
          this.supplierId.set(s.id);
          forkJoin({
            products: this.productSvc.getBySupplier(s.id),
            orders: this.orderSvc.getBySupplier(s.id)
          }).subscribe({
            next: ({ products, orders }) => {
              this.products.set(products);
              this.orders.set(orders);

              const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
              const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.totalAmount, 0);

              this.stats.set({
                products: products.length,
                stock: products.reduce((sum, p) => sum + p.availableStock, 0),
                pending: orders.filter(o => o.status === 'PENDING').length,
                confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
                delivered: deliveredOrders.length,
                totalRevenue
              });

              this.recentOrders.set([...orders].reverse().slice(0, 5));

              this.loading.set(false);
              this.dataLoaded = true;
              if (this.chartsReady) this.renderCharts();
            },
            error: () => this.loading.set(false)
          });
        },
        error: () => this.loading.set(false)
      });
    };

    const userId = this.auth.userId();
    if (userId != null) {
      loadDashboard(userId);
    } else {
      this.auth.fetchMe().subscribe({
        next: u => {
          if (u?.id != null) loadDashboard(u.id);
          else this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (this.dataLoaded) this.renderCharts();
  }

  renderCharts(): void {
    setTimeout(() => {
      this.renderBarChart();
      this.renderDonutChart();
    }, 150);
  }

  // ── Bar Chart: Order amounts grouped by month ──────────────────────────────
  renderBarChart(): void {
    if (!this.barRef) return;
    const ctx = this.barRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const now = new Date();
    const buckets: { label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      });
    }

    const deliveredAmounts: number[] = [];
    const confirmedAmounts: number[] = [];
    const pendingAmounts: number[] = [];

    for (const bucket of buckets) {
      const inBucket = this.orders().filter(o => {
        // ── FIX 1: fall back to confirmedAt if createdAt is absent ──
        const rawDate = o.createdAt ?? o.confirmedAt ?? null;
        if (!rawDate) return false;
        const d = new Date(rawDate);
        // ── FIX 2: guard against Invalid Date ──
        if (isNaN(d.getTime())) return false;
        return d >= bucket.start && d <= bucket.end;
      });

      deliveredAmounts.push(
        inBucket.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.totalAmount, 0)
      );
      confirmedAmounts.push(
        inBucket.filter(o => o.status === 'CONFIRMED').reduce((s, o) => s + o.totalAmount, 0)
      );
      pendingAmounts.push(
        inBucket.filter(o => o.status === 'PENDING').reduce((s, o) => s + o.totalAmount, 0)
      );
    }

    // ── FIX 3: don't render an empty chart ──
    const hasData = [...deliveredAmounts, ...confirmedAmounts, ...pendingAmounts].some(v => v > 0);
    if (!hasData) {
      // Render a friendly empty state on the canvas instead
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No order data for the last 6 months', ctx.canvas.width / 2, ctx.canvas.height / 2);
      return;
    }

    this.destroyChart('bar');

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: buckets.map(b => b.label),
        datasets: [
          {
            label: 'Delivered',
            data: deliveredAmounts,
            backgroundColor: '#10b981',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Confirmed',
            data: confirmedAmounts,
            backgroundColor: '#7c3aed',
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: 'Pending',
            data: pendingAmounts,
            backgroundColor: '#f59e0b',
            borderRadius: 8,
            borderSkipped: false
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
              label: (ctx: any) => ` ₹${(ctx.raw as number).toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#94a3b8' }
          },
          y: {
            stacked: true,
            grid: { color: '#e2e8f0' },
            ticks: {
              color: '#94a3b8',
              callback: (v: any) => '₹' + v.toLocaleString('en-IN')
            }
          }
        }
      }
    });

    this.chartInstances.push({ key: 'bar', instance: chart });
  }

  // ── Donut Chart: Top 5 products by stock ───────────────────────────────────
  renderDonutChart(): void {
    if (!this.donutRef) return;
    const ctx = this.donutRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const top5 = [...this.products()]
      .sort((a, b) => b.availableStock - a.availableStock)
      .slice(0, 5);

    const colors = ['#38bdf8', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];
    const hoverColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f97316', '#ec4899'];

    this.destroyChart('donut');

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: top5.map(p => p.name),
        datasets: [{
          data: top5.map(p => p.availableStock),
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
              padding: 16,
              font: { size: 12 },
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
              label: (ctx: any) => `  ${(ctx.raw as number).toLocaleString('en-IN')} units`
            }
          }
        }
      }
    });

    this.chartInstances.push({ key: 'donut', instance: chart });
  }

  private destroyChart(key: string): void {
    const existing = this.chartInstances.find(c => c.key === key);
    if (existing) {
      existing.instance.destroy();
      this.chartInstances = this.chartInstances.filter(c => c.key !== key);
    }
  }
}