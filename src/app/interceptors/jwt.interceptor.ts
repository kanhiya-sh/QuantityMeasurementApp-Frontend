import { Injectable, inject } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);
  private readonly auth   = inject(AuthService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {

    // Use signal-based token — stays in sync with auth state
    const token = this.auth.token();

    // Skip adding Authorization header for auth endpoints (login/signup)
    const isAuthEndpoint = req.url.includes('/api/v1/auth/');

    const authReq = !isAuthEndpoint && token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          // Token expired or invalid — clear session and redirect to login
          this.auth.clearSession();
          void this.router.navigate(['/login']);
        }
        return throwError(() => err);
      }),
    );
  }
}
