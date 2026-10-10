import { HttpErrorResponse } from '@angular/common/http';
import { LoadFailure } from '@shared/models/types';

/**
 * Status 0 or a timeout means the backend was never reached. So does 504: the
 * service worker answers with it when the network request fails.
 */
export function classify(err: unknown): LoadFailure {
  if (!navigator.onLine) return 'no-network';
  if (
    err instanceof HttpErrorResponse &&
    err.status !== 0 &&
    err.status !== 504
  )
    return 'server';
  return 'no-network';
}
