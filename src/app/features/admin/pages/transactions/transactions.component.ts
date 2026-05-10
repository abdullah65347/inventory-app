import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../services/transaction.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { TransactionResponse } from '../../../common/models/transaction.model';
import { fadeIn } from '../../../../shared/animations/fade.animation';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, LoaderComponent],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
  animations: [fadeIn]
})
export class TransactionsComponent implements OnInit {
  private svc = inject(TransactionService);

  transactions = signal<TransactionResponse[]>([]);
  filtered = signal<TransactionResponse[]>([]);
  loading = signal(true);
  search = '';
  typeFilter = 'all';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({ next: t => { this.transactions.set(t); this.applyFilter(); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  applyFilter(): void {
    let data = this.transactions();
    if (this.typeFilter !== 'all') data = data.filter(t => t.transactionType === this.typeFilter);
    const s = this.search.toLowerCase();
    if (s) data = data.filter(t => t.productName.toLowerCase().includes(s) || t.sku.toLowerCase().includes(s));
    this.filtered.set(data);
  }

  get inCount(): number { return this.transactions().filter(t => t.transactionType === 'STOCK_IN').length; }
  get outCount(): number { return this.transactions().filter(t => t.transactionType === 'STOCK_OUT').length; }
}
