import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: string;
  role: string;
  id: number;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly KEY = 'ims_token';
  private readonly USER_KEY = 'ims_user';

  setToken(token: string): void {
    localStorage.setItem(this.KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private decode(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;
    try { return jwtDecode<JwtPayload>(token); } catch { return null; }
  }

  isValid(): boolean {
    const d = this.decode();
    return !!d && d.exp * 1000 > Date.now();
  }

  getRole(): string | null { return this.decode()?.role ?? null; }

  /** User id from the JWT — reliable even if /auth/me payload is missing it. */
  getUserId(): number | null {
    const d = this.decode();
    return d?.id ?? null;
  }

  saveUser(user: unknown): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser<T>(): T | null {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }
}
