import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import { AccessService } from './access.service';

/**
 * Every call to the backend carries the school login, refreshed first when it is
 * about to run out. Only saving needs it; a 401 or 403 there is handled by the
 * registration itself, so the entered details are never dropped without asking.
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
    )
  );
};
