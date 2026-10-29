import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, tap } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import { AccessService } from './access.service';

/**
 * Every call to the backend carries the school login, refreshed first when it is
 * about to run out. A 401 or 403 while selling tells the access service, which
 * sends the student back to the login; the sale itself stays in the outbox.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(BASE_URL);
  if (!req.url.startsWith(baseUrl)) return next(req);
  const access = inject(AccessService);

  return from(access.token()).pipe(
    switchMap((token) =>
      next(
        token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req
      )
    ),
    tap({
      error: (err: unknown) => {
        if (
          err instanceof HttpErrorResponse &&
          (err.status === 401 || err.status === 403)
        )
          access.lost(err.status);
      },
    })
  );
};
