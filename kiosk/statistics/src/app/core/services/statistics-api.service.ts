import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import { REQUEST_TIMEOUT_MS } from '@shared/constants';
import { Statistics } from '@shared/types';

/** Read-only access to `backend/` (`GET /v1/visitor-statistics`, no login). This app never writes. */
@Injectable({
  providedIn: 'root',
})
export class StatisticsApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  /** Everything the slides show, in one answer. */
  getStatistics(): Promise<unknown> {
    return firstValueFrom(
      this.http
        .get<Statistics>(`${this.baseUrl}/v1/visitor-statistics`)
        .pipe(timeout(REQUEST_TIMEOUT_MS))
    );
  }
}
