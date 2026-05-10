import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { SaleRequest, SaleResponse } from '../../common/models/sale.model';

@Injectable({ providedIn: 'root' })
export class SaleService {
  constructor(private api: ApiService) { }

  create(data: SaleRequest): Observable<SaleResponse> {
    return this.api.post<SaleResponse>(API_ENDPOINTS.SALES.BASE, data);
  }
  getAll(): Observable<SaleResponse[]> {
    return this.api.get<SaleResponse[]>(API_ENDPOINTS.SALES.BASE);
  }
  getById(id: number): Observable<SaleResponse> {
    return this.api.get<SaleResponse>(API_ENDPOINTS.SALES.BY_ID(id));
  }
  getBySoldBy(userId: number): Observable<SaleResponse[]> {
    return this.api.get<SaleResponse[]>(API_ENDPOINTS.SALES.BY_SOLD_BY(userId));
  }
  pay(id: number): Observable<SaleResponse> {
    return this.api.put<SaleResponse>(API_ENDPOINTS.SALES.PAY(id), {});
  }
  deliver(id: number): Observable<SaleResponse> {
    return this.api.put<SaleResponse>(API_ENDPOINTS.SALES.DELIVER(id), {});
  }
}