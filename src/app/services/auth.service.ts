import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { quantityExtractMessage } from './quantity.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

type JwtPayload = Record<string, unknown> & {
  exp?: number;
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
  return payload.exp < Math.floor(Date.now() / 1000);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast  = inject(ToastService);

  // Reads from environment.ts (local) or environment.prod.ts (production)
  private readonly baseUrl = environment.apiUrl;

  readonly loading = signal(false);

  // Single source of truth — initialized once from localStorage
  readonly token = signal<string | null>(AuthService.loadValidToken());

  readonly username = computed(() => {
    const t = this.token();
    if (!t) return '';
    const payload = decodeJwtPayload(t);
    return (payload?.username as string | undefined)
        || (payload?.sub      as string | undefined)
        || (payload?.email    as string | undefined)
        || '';
  });

  readonly isAuthenticated = computed(
    () => !!this.token() && !tokenExpired(this.token()!),
  );

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  private static loadValidToken(): string | null {
    const saved = localStorage.getItem('token');
    if (!saved) return null;
    if (tokenExpired(saved)) {
      localStorage.removeItem('token');
      return null;
    }
    return saved;
  }

  async login(username: string, password: string, returnUrl = '/dashboard'): Promise<void> {
    this.loading.set(true);
    try {
      // Backend returns plain JWT text string
      const raw = await firstValueFrom(
        this.http.post(
          `${this.baseUrl}/api/v1/auth/login`,
          { username, password },
          { responseType: 'text' },
        ),
      );

      const jwt = typeof raw === 'string' ? raw.trim() : '';
      if (!jwt) {
        this.toast.show('Login failed: empty response.', 'error');
        throw new Error('missing_token');
      }

      localStorage.setItem('token', jwt);
      this.token.set(jwt);
      this.toast.show('Login successful.');
      await this.router.navigateByUrl(returnUrl || '/dashboard');

    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'missing_token') throw err;
      if (err instanceof HttpErrorResponse) {
        const msg = err.status === 401
          ? 'Invalid username or password'
          : (quantityExtractMessage(err.error ?? err) || 'Login failed.');
        this.toast.show(msg, 'error');
      } else {
        this.toast.show('Login failed. Please try again.', 'error');
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
      // Backend returns { token, username } on successful signup
      const res = await firstValueFrom(
        this.http.post<any>(`${this.baseUrl}/api/v1/auth/signup`, input),
      );

      if (res?.token) {
        const jwt = String(res.token).trim();
        localStorage.setItem('token', jwt);
        this.token.set(jwt);
        this.toast.show('Account created. Welcome!');
        await this.router.navigateByUrl('/dashboard');
        return;
      }

      this.toast.show('Signup successful. Please log in.');

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

  clearSession(): void {
    localStorage.removeItem('token');
    this.token.set(null);
  }
}
