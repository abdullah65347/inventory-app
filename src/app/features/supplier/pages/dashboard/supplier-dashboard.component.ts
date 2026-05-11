import { Component, OnInit, inject, signal, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SupplierService } from '../../../admin/services/supplier.service';
import { SupplierProductService } from '../../services/supplier-product.service';
import { SupplierOrderService } from '../../services/supplier-order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { PurchaseResponse } from '../../../common/models/purchase.model';
import { SupplierProductResponse } from '../../../common/models/product.model';
import { statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
  selector: 'app-supplier-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  templateUrl: './supplier-dashboard.component.html',
  styleUrls: ['./supplier-dashboard.component.css'],
  animations: [fadeIn]
})
export class SupplierDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChart') pieRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineRef!: ElementRef<HTMLCanvasElement>;

  auth = inject(AuthService);
  supplierSvc = inject(SupplierService);
  productSvc = inject(SupplierProductService);
  orderSvc = inject(SupplierOrderService);

  loading = signal(true);
  supplierId = signal(0);
  products = signal<SupplierProductResponse[]>([]);
  orders = signal<PurchaseResponse[]>([]);
  stats = signal({ products: 0, stock: 0, pending: 0, delivered: 0 });

  chartsReady = false;
  dataLoaded = false;
  statusBadge = statusBadge;

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
              this.stats.set({
                products: products.length,
                stock: products.reduce((sum, p) => sum + p.availableStock, 0),
                pending: orders.filter(o => o.status === 'PENDING').length,
                delivered: orders.filter(o => o.status === 'DELIVERED').length
              });
              this.loading.set(false);
              this.dataLoaded = true;
              if (this.chartsReady) this.renderCharts();
            },
            error: () => this.loading.set(false)
          });
        },
        error: () => { this.loading.set(false); }
      });
    };

    const userId = this.auth.userId();
    if (userId != null) {
      loadDashboard(userId);
    } else {
      // Token present but profile not loaded yet — fetch it then continue.
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
    setTimeout(() => { this.renderPie(); this.renderLine(); }, 120);
  }

  private async getChart(): Promise<any> {
    if ((window as any).Chart) return (window as any).Chart;
    await new Promise<void>(res => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
      s.onload = () => res();
      document.head.appendChild(s);
    });
    return (window as any).Chart;
  }

  async renderPie(): Promise<void> {
    if (!this.pieRef) return;
    const Chart = await this.getChart();
    const ctx = this.pieRef.nativeElement.getContext('2d');
    if (!ctx) return;
    const top5 = this.products().slice(0, 5);
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: top5.map(p => p.name),
        datasets: [{ data: top5.map(p => p.availableStock), backgroundColor: ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'], borderWidth: 0, hoverOffset: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 11 }, color: '#64748b', padding: 12 } } } }
    });
  }

  async renderLine(): Promise<void> {
    if (!this.lineRef) return;
    const Chart = await this.getChart();
    const ctx = this.lineRef.nativeElement.getContext('2d');
    if (!ctx) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
        datasets: [{ label: 'Stock', data: [120, 95, 140, 80, 160, 110], borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,.1)', fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: '#7c3aed' }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } } }, x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } } } }
    });
  }
}
