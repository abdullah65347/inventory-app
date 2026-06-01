import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { User } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) { }

  getAll(): Observable<User[]> {
    return this.api.get<User[]>(API_ENDPOINTS.USERS.BASE);
  }

  getById(id: number): Observable<User> {
    return this.api.get<User>(API_ENDPOINTS.USERS.BY_ID(id));
  }

  update(id: number, data: Partial<User>): Observable<User> {
    return this.api.put<User>(API_ENDPOINTS.USERS.BY_ID(id), data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.USERS.BY_ID(id));
  }

  changePassword(id: number, data: { oldPassword: string; newPassword: string }): Observable<unknown> {
    return this.api.put(API_ENDPOINTS.USERS.PASSWORD(id), data);
  }

  toggleActive(id: number, active: boolean): Observable<User> {
    return this.api.put<User>(
      `${API_ENDPOINTS.USERS.ACTIVE(id)}?active=${active}`,
      {}
    );
  }

  assignRole(id: number, role: string): Observable<User> {
    return this.api.put<User>(
      `${API_ENDPOINTS.USERS.ROLE(id)}?role=${role}`,
      {}
    );
  }
}
