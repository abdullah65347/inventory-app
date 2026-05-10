import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { CategoryRequest, CategoryResponse } from '../../common/models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private api: ApiService) {}

  create(data: CategoryRequest): Observable<CategoryResponse> {
    return this.api.post<CategoryResponse>(API_ENDPOINTS.CATEGORIES.BASE, data);
  }
  getAll(): Observable<CategoryResponse[]> {
    return this.api.get<CategoryResponse[]>(API_ENDPOINTS.CATEGORIES.BASE);
  }
  getById(id: number): Observable<CategoryResponse> {
    return this.api.get<CategoryResponse>(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  }
  update(id: number, data: CategoryRequest): Observable<CategoryResponse> {
    return this.api.put<CategoryResponse>(API_ENDPOINTS.CATEGORIES.BY_ID(id), data);
  }
  delete(id: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.CATEGORIES.BY_ID(id));
  }
}
