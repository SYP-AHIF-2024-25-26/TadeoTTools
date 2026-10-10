import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import { REQUEST_TIMEOUT_MS } from '@shared/constants';
import { VisitorCount, VisitorResult } from '@shared/types';

/** Paths of the legacy statistics endpoints, all `GET /api/Visitors/<path>` without login. */
export type ResultPath =
  | 'bytime'
  | 'departmentcount'
  | 'reasoncount'
  | 'schooltypecount'
  | 'districtcount'
  | 'gendercount';

/** Read-only access to the legacy TadeoT backend. This app never writes. */
@Injectable({
  providedIn: 'root',
})
export class StatisticsApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getCount(): Promise<VisitorCount> {
    return firstValueFrom(
      this.http
        .get<VisitorCount>(`${this.baseUrl}/api/Visitors/count`)
        .pipe(timeout(REQUEST_TIMEOUT_MS))
    );
  }

  getResults(path: ResultPath): Promise<VisitorResult[]> {
    return firstValueFrom(
      this.http
        .get<VisitorResult[]>(`${this.baseUrl}/api/Visitors/${path}`)
        .pipe(timeout(REQUEST_TIMEOUT_MS))
    );
  }
}
