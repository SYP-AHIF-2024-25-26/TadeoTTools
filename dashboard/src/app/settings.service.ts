import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { catchError, firstValueFrom, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  constructor() {}
  public async checkApiKeyExists(key: string): Promise<boolean> {
    const url = `${this.baseUrl}/keyExists`;
    return firstValueFrom(
      this.httpClient.get<any>(`${url}?key=${key}`,{ observe: 'response' }
      ).pipe(
        map((response: HttpResponse<any>) => {
          //return response.status === 200;
          console.log(response);
          if (response.status === 200) {
            return true;
          }
          return false;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('API Key validation failed:', error.message);
          return of(false);
        })
      )
    );
  }
}
