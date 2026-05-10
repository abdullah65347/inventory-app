import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { SupplierRequest, SupplierResponse } from '../../common/models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private api: ApiService) {}

  create(data: SupplierRequest): Observable<SupplierResponse> {
    return this.api.post<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.BASE, data);
  }
  getAll(): Observable<SupplierResponse[]> {
    return this.api.get<SupplierResponse[]>(API_ENDPOINTS.SUPPLIERS.BASE);
  }
  getById(id: number): Observable<SupplierResponse> {
    return this.api.get<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.BY_ID(id));
  }
  update(id: number, data: SupplierRequest): Observable<SupplierResponse> {
    return this.api.put<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.BY_ID(id), data);
  }
  delete(id: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.SUPPLIERS.BY_ID(id));
  }
  toggleActive(id: number, active: boolean): Observable<SupplierResponse> {
    return this.api.put<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.ACTIVE(id), { active });
  }
  getByUser(userId: number): Observable<SupplierResponse> {
    return this.api.get<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.BY_USER(userId));
  }
}
