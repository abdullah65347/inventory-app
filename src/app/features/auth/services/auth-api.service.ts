import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { API_ENDPOINTS } from '../../../shared/constants/api-endpoints.constant';
import { LoginRequest, RegisterRequest, JwtResponse } from '../../../core/models/auth.model';
import { User } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private api: ApiService) {}

  login(req: LoginRequest): Observable<JwtResponse> {
    return this.api.post<JwtResponse>(API_ENDPOINTS.AUTH.LOGIN, req);
  }

  register(req: RegisterRequest): Observable<unknown> {
    return this.api.post(API_ENDPOINTS.AUTH.REGISTER, req);
  }

  me(): Observable<User> {
    return this.api.get<User>(API_ENDPOINTS.AUTH.ME);
  }
}
