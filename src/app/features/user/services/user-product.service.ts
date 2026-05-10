import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { AdminProductResponse } from '../../common/models/product.model';

@Injectable({ providedIn: 'root' })
export class UserProductService {
  constructor(private api: ApiService) {}

  getAll(): Observable<AdminProductResponse[]> {
    return this.api.get<AdminProductResponse[]>(API_ENDPOINTS.PRODUCTS.BASE);
  }
}
