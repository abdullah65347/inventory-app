import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { API_ENDPOINTS } from '../../shared/constants/api-endpoints.constant';
import { ROLES } from '../../shared/constants/roles.constant';
import { LoginRequest, RegisterRequest, JwtResponse } from '../models/auth.model';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);

  constructor(
    private api: ApiService,
    private tokenSvc: TokenService,
    private router: Router
  ) {
    const saved = this.tokenSvc.getUser<User>();
    if (saved && this.tokenSvc.isValid()) {
      this.currentUser.set(saved);
    }
  }

  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.api.post<JwtResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials).pipe(
      tap(res => this.tokenSvc.setToken(res.token))
    );
  }

  register(data: RegisterRequest): Observable<unknown> {
    return this.api.post(API_ENDPOINTS.AUTH.REGISTER, data);
  }

  registerWithRole(data: RegisterRequest, role: string): Observable<unknown> {
    return this.api.post(API_ENDPOINTS.AUTH.REGISTER_ROLE(role), data);
  }

  fetchMe(): Observable<User> {
    return this.api.get<User>(API_ENDPOINTS.AUTH.ME).pipe(
      tap(user => {
        this.tokenSvc.saveUser(user);
        this.currentUser.set(user);
      })
    );
  }

  logout(): void {
    this.tokenSvc.removeToken();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean { return this.tokenSvc.isValid(); }

  getRole(): string | null { return this.currentUser()?.role ?? this.tokenSvc.getRole(); }

  isAdmin(): boolean { return this.getRole() === ROLES.ADMIN; }
  isSupplier(): boolean { return this.getRole() === ROLES.SUPPLIER; }
  isManager(): boolean { return this.getRole() === ROLES.MANAGER; }
  isStaff(): boolean { return this.getRole() === ROLES.STAFF; }

  navigateByRole(): void {
    const role = this.getRole();
    if (role === ROLES.ADMIN) this.router.navigate(['/admin/dashboard']);
    else if (role === ROLES.SUPPLIER) this.router.navigate(['/supplier/dashboard']);
    else if (role === ROLES.MANAGER) this.router.navigate(['/manager/dashboard']);
    else if (role === ROLES.STAFF) this.router.navigate(['/staff/dashboard']);
    else this.router.navigate(['/auth/login']);
  }
}