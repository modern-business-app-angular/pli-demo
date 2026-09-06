import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the JWT Bearer token to every outgoing HTTP request.
 * Skips if no token is present (e.g., login request itself).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.accessToken();

  if (token) {
    return next(
      req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    );
  }

  return next(req);
};
