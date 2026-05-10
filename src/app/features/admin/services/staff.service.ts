import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { StaffRequest, StaffResponse } from '../../common/models/staff.model';

@Injectable({ providedIn: 'root' })
export class StaffService {
    constructor(private api: ApiService) { }

    create(data: StaffRequest): Observable<StaffResponse> {
        return this.api.post<StaffResponse>(API_ENDPOINTS.STAFF.BASE, data);
    }
    getAll(): Observable<StaffResponse[]> {
        return this.api.get<StaffResponse[]>(API_ENDPOINTS.STAFF.BASE);
    }
    getById(id: number): Observable<StaffResponse> {
        return this.api.get<StaffResponse>(API_ENDPOINTS.STAFF.BY_ID(id));
    }
    getByUser(userId: number): Observable<StaffResponse> {
        return this.api.get<StaffResponse>(API_ENDPOINTS.STAFF.BY_USER(userId));
    }
    getByManager(managerId: number): Observable<StaffResponse[]> {
        return this.api.get<StaffResponse[]>(API_ENDPOINTS.STAFF.BY_MANAGER(managerId));
    }
    assignManager(staffId: number, managerId: number): Observable<StaffResponse> {
        return this.api.put<StaffResponse>(API_ENDPOINTS.STAFF.ASSIGN_MANAGER(staffId, managerId), {});
    }
    toggleActive(id: number, active: boolean): Observable<StaffResponse> {
        return this.api.put<StaffResponse>(`${API_ENDPOINTS.STAFF.ACTIVE(id)}?active=${active}`, {});
    }
    delete(id: number): Observable<void> {
        return this.api.delete<void>(API_ENDPOINTS.STAFF.BY_ID(id));
    }
}