import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import {
  City,
  RegistrationOptions,
  VisitorCount,
  VisitorSubmission,
} from '@shared/models/types';
import { SAVE_TIMEOUT_MS } from '@shared/constants';

/** The endpoints of `backend/` that the kiosk uses; none needs a login. */
@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getCities(): Promise<City[]> {
    return firstValueFrom(this.http.get<City[]>(`${this.baseUrl}/v1/cities`));
  }

  getOptions(): Promise<RegistrationOptions> {
    return firstValueFrom(
      this.http.get<RegistrationOptions>(
        `${this.baseUrl}/v1/registration-options`
      )
    );
  }

  getCount(): Promise<VisitorCount> {
    return firstValueFrom(
      this.http.get<VisitorCount>(`${this.baseUrl}/v1/visitors/count`)
    );
  }

  /** Saves the visitor and returns the new id (the number for the licence). */
  addVisitor(visitor: VisitorSubmission): Promise<number> {
    return firstValueFrom(
      this.http
        .post<number>(`${this.baseUrl}/v1/visitors`, visitor)
        .pipe(timeout(SAVE_TIMEOUT_MS))
    );
  }
}
