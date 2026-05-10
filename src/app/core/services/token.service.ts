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

  isValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.role ?? null;
    } catch {
      return null;
    }
  }

  saveUser(user: unknown): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser<T>(): T | null {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }
}
