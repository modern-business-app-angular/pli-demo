import { HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Global HTTP error handler.
 * Maps status codes to French user-facing messages via NG-ZORRO toast.
 * 401 → clears session and redirects to login.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router  = inject(Router);
  const message = inject(NzMessageService);
  const auth    = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      switch (error.status as HttpStatusCode) {
        case HttpStatusCode.Unauthorized:
          auth.clearSession();
          router.navigate(['/auth']);
          break;

        case HttpStatusCode.Forbidden:
          message.error('Accès non autorisé à cette ressource.');
          break;

        case HttpStatusCode.NotFound:
          message.warning('Ressource introuvable.');
          break;

        case HttpStatusCode.InternalServerError:
          message.error('Erreur serveur. Veuillez réessayer.');
          break;

        default:
          if (error.status >= 400) {
            const msg =
              error.error?.message ?? 'Une erreur inattendue est survenue.';
            message.error(msg);
          }
      }

      return throwError(() => error);
    })
  );
};
