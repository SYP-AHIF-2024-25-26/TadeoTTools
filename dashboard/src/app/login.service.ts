import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { BASE_URL } from './app.config';
import { catchError, firstValueFrom, of } from 'rxjs';
import { Info } from './types';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);
  private readonly infoStore = inject(InfoStore);
  response = signal<string | null>(null);
  showResponse = computed(() => this.response() !== null);

  public async performCall(action: string): Promise<string> {
    try {
      const route = this.baseUrl + `/users/${action}`;
      const result = await firstValueFrom(
        this.httpClient.get(route, { responseType: 'text' }).pipe(catchError((err: HttpErrorResponse) => {
          const errorMessage = `Backend says no: ${err.status}`;
          this.infoStore.addInfo({ id: 0, type: 'error', message: 'Login error' });
          return of(errorMessage);
        }))
      );

      // Only show success message if there was no error
      if (!result.includes('Backend says no')) {
        this.infoStore.addInfo({ id: 0, type: 'info', message: 'Login successful' });
      }

      return result;
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Login error' });
      throw error;
    }
  }
}
