import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { PurchaseRequest, PurchaseResponse } from '../../common/models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  constructor(private api: ApiService) { }

  create(data: PurchaseRequest): Observable<PurchaseResponse> {
    return this.api.post<PurchaseResponse>(API_ENDPOINTS.PURCHASES.BASE, data);
  }
  getAll(): Observable<PurchaseResponse[]> {
    return this.api.get<PurchaseResponse[]>(API_ENDPOINTS.PURCHASES.BASE);
  }
  getById(id: number): Observable<PurchaseResponse> {
    return this.api.get<PurchaseResponse>(API_ENDPOINTS.PURCHASES.BY_ID(id));
  }
  getBySupplier(supplierId: number): Observable<PurchaseResponse[]> {
    return this.api.get<PurchaseResponse[]>(API_ENDPOINTS.PURCHASES.BY_SUPPLIER(supplierId));
  }
  getByStatus(status: string): Observable<PurchaseResponse[]> {
    return this.api.get<PurchaseResponse[]>(API_ENDPOINTS.PURCHASES.BY_STATUS(status));
  }
  deliver(id: number): Observable<PurchaseResponse> {
    return this.api.put<PurchaseResponse>(API_ENDPOINTS.PURCHASES.DELIVER(id), {});
  }
  confirm(id: number): Observable<PurchaseResponse> {
    return this.api.put<PurchaseResponse>(API_ENDPOINTS.PURCHASES.CONFIRM(id), {});
  }
  cancel(id: number): Observable<PurchaseResponse> {
    return this.api.put<PurchaseResponse>(API_ENDPOINTS.PURCHASES.CANCEL(id), {});
  }
}