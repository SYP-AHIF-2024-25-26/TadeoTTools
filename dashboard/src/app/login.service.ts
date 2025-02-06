import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { BASE_URL } from './app.config';
import { catchError, finalize, firstValueFrom, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);
  response = signal<string | null>(null);
  loading = signal(false);
  showResponse = computed(() => this.response() !== null);

  constructor() {}

  public performCall(action: string): void {
    const route = this.baseUrl + `/api/${action}`;

    this.loading.set(true);

    // bearer token is automatically added by the interceptor
    this.httpClient.get(route, { responseType: "text" })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.response.update(() => res);
        },
        error: err => {
          this.response.update(() => `Backend says no: ${err.status}`);
        }
      });
  }
}
