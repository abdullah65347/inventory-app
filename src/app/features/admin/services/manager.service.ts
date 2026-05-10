import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { ManagerRequest, ManagerResponse } from '../../common/models/manager.model';

@Injectable({ providedIn: 'root' })
export class ManagerService {
    constructor(private api: ApiService) { }

    create(data: ManagerRequest): Observable<ManagerResponse> {
        return this.api.post<ManagerResponse>(API_ENDPOINTS.MANAGERS.BASE, data);
    }
    getAll(): Observable<ManagerResponse[]> {
        return this.api.get<ManagerResponse[]>(API_ENDPOINTS.MANAGERS.BASE);
    }
    getById(id: number): Observable<ManagerResponse> {
        return this.api.get<ManagerResponse>(API_ENDPOINTS.MANAGERS.BY_ID(id));
    }
    getByUser(userId: number): Observable<ManagerResponse> {
        return this.api.get<ManagerResponse>(API_ENDPOINTS.MANAGERS.BY_USER(userId));
    }
    update(id: number, data: Partial<ManagerRequest>): Observable<ManagerResponse> {
        return this.api.put<ManagerResponse>(API_ENDPOINTS.MANAGERS.BY_ID(id), data);
    }
    toggleActive(id: number, active: boolean): Observable<ManagerResponse> {
        return this.api.put<ManagerResponse>(`${API_ENDPOINTS.MANAGERS.ACTIVE(id)}?active=${active}`, {});
    }
    delete(id: number): Observable<void> {
        return this.api.delete<void>(API_ENDPOINTS.MANAGERS.BY_ID(id));
    }
}