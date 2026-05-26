import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SaleService } from '../../../user/services/sale.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';

import { SaleResponse } from '../../../common/models/sale.model';

import { fadeIn } from '../../../../shared/animations/fade.animation';
import { paymentModeBadge } from '../../../../core/utils/role.util';

@Component({
  selector: 'app-admin-sales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoaderComponent
  ],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
  animations: [fadeIn]
})
export class AdminSalesComponent implements OnInit {

  private svc = inject(SaleService);
  private toast = inject(ToastService);

  sales = signal<SaleResponse[]>([]);
  filtered = signal<SaleResponse[]>([]);

  loading = signal<boolean>(true);

  detailItem = signal<SaleResponse | null>(null);

  paymentModeBadge = paymentModeBadge;

  ngOnInit(): void {
    this.load();
  }

  load(): void {

    this.loading.set(true);

    this.svc.getAll().subscribe({

      next: (res) => {

        this.sales.set(res);
        this.filtered.set(res);

        this.loading.set(false);
      },

      error: (err) => {

        console.error(err);

        this.toast.error(
          err?.error?.message || 'Failed to load sales'
        );

        this.loading.set(false);
      }
    });
  }

  openDetails(sale: SaleResponse): void {
    this.detailItem.set(sale);
  }

  closeDetails(): void {
    this.detailItem.set(null);
  }
}