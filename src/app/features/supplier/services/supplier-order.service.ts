import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { PurchaseResponse } from '../../common/models/purchase.model';

@Injectable({ providedIn: 'root' })
export class SupplierOrderService {
  constructor(private api: ApiService) { }

  getBySupplier(supplierId: number): Observable<PurchaseResponse[]> {
    return this.api.get<PurchaseResponse[]>(API_ENDPOINTS.PURCHASES.BY_SUPPLIER(supplierId));
  }

  getById(id: number): Observable<PurchaseResponse> {
    return this.api.get<PurchaseResponse>(API_ENDPOINTS.PURCHASES.BY_ID(id));
  }

  deliver(id: number): Observable<PurchaseResponse> {
    return this.api.put<PurchaseResponse>(API_ENDPOINTS.PURCHASES.DELIVER(id), {});
  }
}
