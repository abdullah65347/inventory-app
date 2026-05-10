import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRole: string = route.data['role'];

  if (!auth.isLoggedIn()) {
    router.navigate(['/auth/login']);
    return false;
  }
  if (auth.getRole() === requiredRole) return true;

  auth.navigateByRole();
  return false;
};
