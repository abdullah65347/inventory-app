import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { ProductRequest, SupplierProductResponse } from '../../common/models/product.model';

@Injectable({ providedIn: 'root' })
export class SupplierProductService {
  constructor(private api: ApiService) {}

  create(data: ProductRequest): Observable<SupplierProductResponse> {
    return this.api.post<SupplierProductResponse>(API_ENDPOINTS.PRODUCTS.BASE, data);
  }
  getBySupplier(supplierId: number): Observable<SupplierProductResponse[]> {
    return this.api.get<SupplierProductResponse[]>(API_ENDPOINTS.PRODUCTS.BY_SUPPLIER(supplierId));
  }
  updatePrice(id: number, price: number): Observable<SupplierProductResponse> {
    return this.api.put<SupplierProductResponse>(API_ENDPOINTS.PRODUCTS.SUPPLIER_PRICE(id), { supplierToAdminPrice: price });
  }
  addStock(id: number, quantity: number): Observable<SupplierProductResponse> {
    return this.api.post<SupplierProductResponse>(API_ENDPOINTS.PRODUCTS.ADD_STOCK(id), { quantity });
  }
}
