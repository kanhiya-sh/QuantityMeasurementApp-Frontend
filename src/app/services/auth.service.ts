import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { quantityExtractMessage } from './quantity.service';
import { firstValueFrom } from 'rxjs';

type JwtPayload = Record<string, unknown> & {
  exp?: number; // seconds since epoch
  username?: string;
  sub?: string;
  email?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function tokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp < nowSeconds;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly baseUrl = 'http://localhost:8080';

  readonly loading = signal(false);

  readonly token = signal<string | null>(localStorage.getItem('token'));

  readonly username = computed(() => {
    const t = this.token();
    if (!t) return '';
    const payload = decodeJwtPayload(t);
    return (
      (payload?.username as string | undefined) ||
      (payload?.sub as string | undefined) ||
      (payload?.email as string | undefined) ||
      ''
    );
  });

  readonly isAuthenticated = computed(() => !!this.token() && !tokenExpired(this.token()!));

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  constructor() {
    const t = localStorage.getItem('token');
    if (!t) return;
    if (tokenExpired(t)) {
      localStorage.removeItem('token');
      this.token.set(null);
    } else {
      this.token.set(t);
    }
  }

  async login(username: string, password: string, returnUrl = '/dashboard'): Promise<void> {
    this.loading.set(true);
    try {
      const raw = await firstValueFrom(
        this.http.post(`${this.baseUrl}/api/v1/auth/login`, { username, password }, {
          responseType: 'text',
        }),
      );

      const jwt = typeof raw === 'string' ? raw.trim() : '';
      if (!jwt) {
        this.toast.show('Login failed: missing token.', 'error');
        throw new Error('missing_token');
      }

      localStorage.setItem('token', jwt);
      this.token.set(jwt);
      this.toast.show('Login successful.');
      await this.router.navigateByUrl(returnUrl || '/dashboard');
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        this.toast.show('Invalid username or password', 'error');
      } else {
        const msg = quantityExtractMessage(
          err instanceof HttpErrorResponse ? err.error ?? err : (err as any)?.error ?? err,
        );
        this.toast.show(msg || 'Login failed.', 'error');
      }
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async signup(input: {
    fullName: string;
    email: string;
    password: string;
    mobile: string;
  }): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/api/v1/auth/signup`, input),
      );

      // If backend returns a token on signup, accept it automatically.
      if (res?.token) {
        localStorage.setItem('token', res.token);
        this.token.set(res.token);
        this.toast.show('Account created. Logged in.');
        await this.router.navigateByUrl('/dashboard');
        return;
      }

      this.toast.show('Signup successful. Please login.');
    } catch (err: any) {
      const msg = quantityExtractMessage(err?.error ?? err);
      this.toast.show(msg || 'Signup failed.', 'error');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    this.token.set(null);
    this.toast.show('Logged out.');
    void this.router.navigateByUrl('/login');
  }

  /**
   * Used by the JWT interceptor to keep signal-based auth state consistent.
   * No toast to avoid noisy UI during background 401 refreshes.
   */
  clearSession(): void {
    localStorage.removeItem('token');
    this.token.set(null);
  }
}
