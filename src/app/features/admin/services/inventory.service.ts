import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { InventoryResponse } from '../../common/models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  constructor(private api: ApiService) { }

  getAll(): Observable<InventoryResponse[]> {
    return this.api.get<InventoryResponse[]>(API_ENDPOINTS.INVENTORY.BASE);
  }
  getByProduct(productId: number): Observable<InventoryResponse> {
    return this.api.get<InventoryResponse>(API_ENDPOINTS.INVENTORY.BY_PRODUCT(productId));
  }
  setReorderLevel(productId: number, reorderLevel: number): Observable<InventoryResponse> {
    return this.api.put<InventoryResponse>(API_ENDPOINTS.INVENTORY.REORDER(productId), { reorderLevel });
  }

  getLowStock(): Observable<InventoryResponse[]> {
    return this.api.get<InventoryResponse[]>(API_ENDPOINTS.INVENTORY.LOW_STOCK);
  }

}
