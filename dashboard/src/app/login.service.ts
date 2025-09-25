import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { BASE_URL } from './app.config';
import { catchError, firstValueFrom, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);
  private response = signal<string | null>(null);
  showResponse = computed(() => this.response() !== null);

  performCall(action: string): Promise<string> {
    const route = `${this.baseUrl}/users/${action}`;
    
    return firstValueFrom(
      this.httpClient.get(route, { responseType: 'text' }).pipe(
        catchError((err: HttpErrorResponse) => 
          of(`Backend says no: ${err.status}`)
        )
      )
    );
  }
}
