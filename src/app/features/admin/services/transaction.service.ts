import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { TransactionRequest, TransactionResponse } from '../../common/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private api: ApiService) {}

  create(data: TransactionRequest): Observable<TransactionResponse> {
    return this.api.post<TransactionResponse>(API_ENDPOINTS.TRANSACTIONS.BASE, data);
  }
  getAll(): Observable<TransactionResponse[]> {
    return this.api.get<TransactionResponse[]>(API_ENDPOINTS.TRANSACTIONS.BASE);
  }
  getByProduct(productId: number): Observable<TransactionResponse[]> {
    return this.api.get<TransactionResponse[]>(API_ENDPOINTS.TRANSACTIONS.BY_PRODUCT(productId));
  }
}
