import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { CustomerRequest, CustomerResponse } from '../../common/models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
    constructor(private api: ApiService) { }

    create(data: CustomerRequest): Observable<CustomerResponse> {
        return this.api.post<CustomerResponse>(API_ENDPOINTS.CUSTOMERS.BASE, data);
    }
    getAll(): Observable<CustomerResponse[]> {
        return this.api.get<CustomerResponse[]>(API_ENDPOINTS.CUSTOMERS.BASE);
    }
    getById(id: number): Observable<CustomerResponse> {
        return this.api.get<CustomerResponse>(API_ENDPOINTS.CUSTOMERS.BY_ID(id));
    }
    getByPhone(phone: string): Observable<CustomerResponse> {
        return this.api.get<CustomerResponse>(API_ENDPOINTS.CUSTOMERS.BY_PHONE(phone));
    }
    update(id: number, data: Partial<CustomerRequest>): Observable<CustomerResponse> {
        return this.api.put<CustomerResponse>(API_ENDPOINTS.CUSTOMERS.BY_ID(id), data);
    }
    delete(id: number): Observable<void> {
        return this.api.delete<void>(API_ENDPOINTS.CUSTOMERS.BY_ID(id));
    }
}