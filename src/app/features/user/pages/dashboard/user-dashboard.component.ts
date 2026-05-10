import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { AuthService } from '../../../../core/services/auth.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SaleResponse } from '../../../common/models/sale.model';
import { statusBadge } from '../../../../core/utils/role.util';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoaderComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  animations: [fadeIn]
})
export class UserDashboardComponent implements OnInit {
  auth    = inject(AuthService);
  saleSvc = inject(SaleService);

  loading = signal(true);
  orders  = signal<SaleResponse[]>([]);
  stats   = signal({ total: 0, pending: 0, delivered: 0, spent: 0 });
  statusBadge = statusBadge;

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (!user) return;
    this.saleSvc.getByUser(user.id).subscribe({
      next: sales => {
        this.orders.set([...sales].reverse().slice(0, 5));
        this.stats.set({
          total:     sales.length,
          pending:   sales.filter(s => s.status === 'PENDING').length,
          delivered: sales.filter(s => s.status === 'DELIVERED').length,
          spent:     sales.reduce((sum, s) => sum + s.totalAmount, 0)
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
