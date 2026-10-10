import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import { City, VisitorCount, VisitorSubmission } from '@shared/models/types';
import { SAVE_TIMEOUT_MS } from '@shared/constants';

/** The endpoints of the legacy TadeoT backend that the kiosk uses; none needs a login. */
@Injectable({
  providedIn: 'root',
})
export class RegistrationApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getCities(): Promise<City[]> {
    return firstValueFrom(this.http.get<City[]>(`${this.baseUrl}/api/Cities`));
  }

  getReasons(): Promise<string[]> {
    return firstValueFrom(
      this.http.get<string[]>(`${this.baseUrl}/api/ReasonsForVisit`)
    );
  }

  getSchoolTypes(): Promise<string[]> {
    return firstValueFrom(
      this.http.get<string[]>(`${this.baseUrl}/api/SchoolTypes`)
    );
  }

  getCount(): Promise<VisitorCount> {
    return firstValueFrom(
      this.http.get<VisitorCount>(`${this.baseUrl}/api/Visitors/count`)
    );
  }

  /** Saves the visitor and returns the new id (the number for the licence). */
  addVisitor(visitor: VisitorSubmission): Promise<number> {
    return firstValueFrom(
      this.http
        .post<number>(`${this.baseUrl}/api/Visitors`, visitor)
        .pipe(timeout(SAVE_TIMEOUT_MS))
    );
  }
}
