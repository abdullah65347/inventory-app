import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { ProductRequest, AdminProductResponse, SupplierProductResponse } from '../../common/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private api: ApiService) { }

  create(data: ProductRequest): Observable<SupplierProductResponse> {
    return this.api.post<SupplierProductResponse>(API_ENDPOINTS.PRODUCTS.BASE, data);
  }
  createByAdmin(data: any) {
    return this.api.post(`${API_ENDPOINTS.PRODUCTS.BASE}/admin`, data);
  }
  getAll(): Observable<AdminProductResponse[]> {
    return this.api.get<AdminProductResponse[]>(API_ENDPOINTS.PRODUCTS.BASE);
  }
  getAdminProducts(): Observable<AdminProductResponse[]> {
    return this.api.get<AdminProductResponse[]>(API_ENDPOINTS.PRODUCTS.ADMIN);
  }
  getBySupplier(supplierId: number): Observable<SupplierProductResponse[]> {
    return this.api.get<SupplierProductResponse[]>(API_ENDPOINTS.PRODUCTS.BY_SUPPLIER(supplierId));
  }
  updateSupplierPrice(id: number, price: number): Observable<SupplierProductResponse> {
    return this.api.put<SupplierProductResponse>(API_ENDPOINTS.PRODUCTS.SUPPLIER_PRICE(id), { supplierToAdminPrice: price });
  }
  updateAdminPrice(id: number, price: number) {
    return this.api.put(`${API_ENDPOINTS.PRODUCTS.ADMIN_PRICE(id)}?price=${price}`, {});
  }
  addStock(id: number, quantity: number): Observable<SupplierProductResponse> {
    return this.api.post<SupplierProductResponse>(API_ENDPOINTS.PRODUCTS.ADD_STOCK(id), { quantity });
  }
}
