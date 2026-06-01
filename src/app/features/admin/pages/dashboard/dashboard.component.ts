import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoaderComponent,
    AppTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [fadeIn, fadeInList]
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {

  // ─────────────────────────────────────────────────────────
  // VIEWCHILD
  // ─────────────────────────────────────────────────────────

  @ViewChild('barChart')
  barRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('pieChart')
  pieRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('lineChart')
  lineRef!: ElementRef<HTMLCanvasElement>;

  // ─────────────────────────────────────────────────────────
  // SERVICES
  // ─────────────────────────────────────────────────────────

  auth = inject(AuthService);

  private userSvc = inject(UserService);
  private supSvc = inject(SupplierService);
  private prodSvc = inject(ProductService);
  private invSvc = inject(InventoryService);
  private txSvc = inject(TransactionService);
  private saleSvc = inject(SaleService);

  // ─────────────────────────────────────────────────────────
  // SIGNALS
  // ─────────────────────────────────────────────────────────

  loading = signal(true);

  recentSales = signal<SaleResponse[]>([]);
  lowStock = signal<InventoryResponse[]>([]);

  stats = signal({
    users: 0,
    suppliers: 0,
    products: 0,
    revenue: 0,
    sales: 0,
    lowStock: 0
  });

  paymentModeBadge = paymentModeBadge;

  // ─────────────────────────────────────────────────────────
  // DATA STORAGE
  // ─────────────────────────────────────────────────────────

  private salesData: SaleResponse[] = [];
  private txData: TransactionResponse[] = [];
  private prodData: any[] = [];

  chartsReady = false;
  dataLoaded = false;

  private chartInstances: any[] = [];

  // ─────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────

  ngOnInit(): void {

    forkJoin({
      users: this.userSvc.getAll().pipe(
        catchError(() => of([]))
      ),

      suppliers: this.supSvc.getAll().pipe(
        catchError(() => of([]))
      ),

      products: this.prodSvc.getAdminProducts().pipe(
        catchError(() => of([]))
      ),

      sales: this.saleSvc.getAll().pipe(
        catchError(() => of([]))
      ),

      inventory: this.invSvc.getAll().pipe(
        catchError(() => of([]))
      ),

      txs: this.txSvc.getAll().pipe(
        catchError(() => of([]))
      )

    }).subscribe(({
      users,
      suppliers,
      products,
      sales,
      inventory,
      txs
    }) => {

      const lowStockItems = (inventory as InventoryResponse[])
        .filter(item =>
          item.availableStock <= item.reorderLevel
        );

      const totalRevenue = (sales as SaleResponse[])
        .reduce((sum, sale) =>
          sum + sale.totalAmount, 0
        );

      this.stats.set({
        users: users.length,
        suppliers: suppliers.length,
        products: products.length,
        revenue: totalRevenue,
        sales: sales.length,
        lowStock: lowStockItems.length
      });

      this.recentSales.set(
        [...(sales as SaleResponse[])]
          .reverse()
          .slice(0, 5)
      );

      this.lowStock.set(
        lowStockItems.slice(0, 5)
      );

      // store chart data

      this.salesData = sales as SaleResponse[];
      this.txData = txs as TransactionResponse[];
      this.prodData = products as any[];

      this.loading.set(false);

      this.dataLoaded = true;

      if (this.chartsReady) {
        this.renderCharts();
      }

    });
  }

  ngAfterViewInit(): void {

    this.chartsReady = true;

    if (this.dataLoaded) {
      this.renderCharts();
    }
  }

  // ─────────────────────────────────────────────────────────
  // RENDER ALL CHARTS
  // ─────────────────────────────────────────────────────────

  renderCharts(): void {

    setTimeout(() => {

      this.renderBarChart();
      this.renderPieChart();
      this.renderLineChart();

    }, 150);
  }

  // ─────────────────────────────────────────────────────────
  // BAR CHART
  // ─────────────────────────────────────────────────────────

  renderBarChart(): void {

    if (!this.barRef) return;

    const ctx = this.barRef.nativeElement.getContext('2d');

    if (!ctx) return;

    const now = new Date();

    const labels: string[] = [];
    const revenues: number[] = [];
    const orders: number[] = [];

    for (let i = 5; i >= 0; i--) {

      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      labels.push(
        d.toLocaleString('default', {
          month: 'short',
          year: '2-digit'
        })
      );

      const monthSales = this.salesData.filter(sale => {

        const saleDate = new Date(sale.saleDate);

        return (
          saleDate.getFullYear() === d.getFullYear() &&
          saleDate.getMonth() === d.getMonth()
        );
      });

      revenues.push(
        monthSales.reduce(
          (sum, sale) => sum + sale.totalAmount,
          0
        )
      );

      orders.push(monthSales.length);
    }

    this.destroyChart('bar');

    const chart = new Chart(ctx, {

      type: 'bar',

      data: {

        labels,

        datasets: [

          {
            label: 'Revenue (₹)',

            data: revenues,

            backgroundColor: [
              '#2563eb',
              '#3b82f6',
              '#60a5fa',
              '#93c5fd',
              '#1d4ed8',
              '#1e40af'
            ],

            borderRadius: 10,
            borderSkipped: false,
            yAxisID: 'y'
          },

          {
            label: 'Orders',

            data: orders,

            backgroundColor: [
              '#10b981',
              '#34d399',
              '#6ee7b7',
              '#059669',
              '#047857',
              '#065f46'
            ],

            borderRadius: 10,
            borderSkipped: false,
            yAxisID: 'y1'
          }

        ]
      },

      options: {

        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: 'index',
          intersect: false
        },

        plugins: {

          legend: {

            labels: {
              color: '#64748b',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },

          tooltip: {

            callbacks: {

              label: (ctx: any) => {

                return ctx.datasetIndex === 0
                  ? ` ₹${ctx.raw.toLocaleString('en-IN')}`
                  : ` ${ctx.raw} Orders`;
              }
            }
          }
        },

        scales: {

          y: {

            position: 'left',

            grid: {
              color: '#e2e8f0'
            },

            ticks: {

              color: '#94a3b8',

              callback: (value: any) =>
                '₹' + value.toLocaleString('en-IN')
            }
          },

          y1: {

            position: 'right',

            grid: {
              drawOnChartArea: false
            },

            ticks: {
              color: '#94a3b8'
            }
          },

          x: {

            grid: {
              display: false
            },

            ticks: {
              color: '#94a3b8'
            }
          }
        }
      }
    });

    this.chartInstances.push({
      key: 'bar',
      instance: chart
    });
  }

  // ─────────────────────────────────────────────────────────
  // PIE CHART
  // ─────────────────────────────────────────────────────────

  renderPieChart(): void {

    if (!this.pieRef) return;

    const ctx = this.pieRef.nativeElement.getContext('2d');

    if (!ctx) return;

    const modes = [
      'CASH',
      'CARD',
      'UPI',
      'CREDIT'
    ];

    const counts = modes.map(mode =>
      this.salesData.filter(
        sale => sale.paymentMode === mode
      ).length
    );

    const revenues = modes.map(mode =>
      this.salesData
        .filter(sale => sale.paymentMode === mode)
        .reduce((sum, sale) =>
          sum + sale.totalAmount, 0)
    );

    const activeLabels = modes.filter(
      (_, i) => counts[i] > 0
    );

    const activeCounts = counts.filter(
      count => count > 0
    );

    const activeRevenues = revenues.filter(
      (_, i) => counts[i] > 0
    );

    const colors = [
      '#0ea5e9',
      '#8b5cf6',
      '#22c55e',
      '#f97316'
    ];

    const activeColors = colors.filter(
      (_, i) => counts[i] > 0
    );

    this.destroyChart('pie');

    const chart = new Chart(ctx, {

      type: 'doughnut',

      data: {

        labels: activeLabels,

        datasets: [
          {
            data: activeCounts,

            backgroundColor: activeColors,

            borderColor: '#ffffff',

            borderWidth: 3,

            hoverOffset: 10
          }
        ]
      },

      options: {

        responsive: true,
        maintainAspectRatio: false,

        plugins: {

          legend: {

            position: 'right',

            labels: {
              color: '#64748b',
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },

          tooltip: {

            callbacks: {

              label: (ctx: any) => {

                const revenue =
                  activeRevenues[ctx.dataIndex];

                return `
                  ${ctx.label}: ${ctx.raw} Sales
                  | ₹${revenue.toLocaleString('en-IN')}
                `;
              }
            }
          }
        }
      }
    });

    this.chartInstances.push({
      key: 'pie',
      instance: chart
    });
  }

  // ─────────────────────────────────────────────────────────
  // LINE CHART
  // ─────────────────────────────────────────────────────────

  renderLineChart(): void {

    if (!this.lineRef) return;

    const ctx = this.lineRef.nativeElement.getContext('2d');

    if (!ctx) return;

    const now = new Date();

    const labels: string[] = [];

    const stockIn: number[] = [];
    const stockOut: number[] = [];

    for (let i = 5; i >= 0; i--) {

      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      labels.push(
        d.toLocaleString('default', {
          month: 'short',
          year: '2-digit'
        })
      );

      const monthlyTx = this.txData.filter(tx => {

        const txDate = new Date(tx.createdAt);

        return (
          txDate.getFullYear() === d.getFullYear() &&
          txDate.getMonth() === d.getMonth()
        );
      });

      stockIn.push(

        monthlyTx
          .filter(tx =>
            tx.transactionType === 'STOCK_IN'
          )
          .reduce((sum, tx) =>
            sum + tx.quantity, 0)
      );

      stockOut.push(

        monthlyTx
          .filter(tx =>
            tx.transactionType === 'STOCK_OUT'
          )
          .reduce((sum, tx) =>
            sum + tx.quantity, 0)
      );
    }

    this.destroyChart('line');

    const chart = new Chart(ctx, {

      type: 'line',

      data: {

        labels,

        datasets: [

          {
            label: 'Stock In',

            data: stockIn,

            borderColor: '#14b8a6',

            backgroundColor:
              'rgba(20,184,166,0.15)',

            fill: true,

            tension: 0.4,

            pointRadius: 5,

            pointHoverRadius: 7,

            pointBackgroundColor: '#14b8a6',

            pointBorderColor: '#fff',

            pointBorderWidth: 2,

            borderWidth: 3
          },

          {
            label: 'Stock Out',

            data: stockOut,

            borderColor: '#f43f5e',

            backgroundColor:
              'rgba(244,63,94,0.12)',

            fill: true,

            tension: 0.4,

            pointRadius: 5,

            pointHoverRadius: 7,

            pointBackgroundColor: '#f43f5e',

            pointBorderColor: '#fff',

            pointBorderWidth: 2,

            borderWidth: 3
          }
        ]
      },

      options: {

        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: 'index',
          intersect: false
        },

        plugins: {

          legend: {

            labels: {
              color: '#64748b',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },

          tooltip: {

            callbacks: {

              label: (ctx: any) =>
                `${ctx.dataset.label}: ${ctx.raw} Units`
            }
          }
        },

        scales: {

          y: {

            grid: {
              color: '#e2e8f0'
            },

            ticks: {
              color: '#94a3b8'
            }
          },

          x: {

            grid: {
              display: false
            },

            ticks: {
              color: '#94a3b8'
            }
          }
        }
      }
    });

    this.chartInstances.push({
      key: 'line',
      instance: chart
    });
  }

  // ─────────────────────────────────────────────────────────
  // DESTROY CHART
  // ─────────────────────────────────────────────────────────

  private destroyChart(key: string): void {

    const existingChart =
      this.chartInstances.find(
        chart => chart.key === key
      );

    if (existingChart) {

      existingChart.instance.destroy();

      this.chartInstances =
        this.chartInstances.filter(
          chart => chart.key !== key
        );
    }
  }
}