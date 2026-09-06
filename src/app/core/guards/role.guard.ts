import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Protects routes that require specific roles.
 * Usage in routes: { data: { roles: ['ADMIN'] }, canActivate: [roleGuard] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const required = (route.data['roles'] as string[]) ?? [];

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/auth']);
  }

  const user = auth.currentUser();
  const hasRole = required.every((r) => user?.roles.includes(r) ?? false);

  if (hasRole) {
    return true;
  }

  // Authenticated but lacks required role — redirect to dashboard
  return router.createUrlTree(['/dashboard']);
};
