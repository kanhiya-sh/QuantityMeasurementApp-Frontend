import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!auth.isAuthenticated()) return true;
  const returnUrl = route.queryParamMap.get('returnUrl');
  return router.createUrlTree([returnUrl || '/dashboard']);
};