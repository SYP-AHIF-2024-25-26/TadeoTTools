import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  addAdmin(name: string): Promise<void> {
    return firstValueFrom(
      this.httpClient.post<void>(
        `${this.baseUrl}/api/admins?name=${encodeURIComponent(name)}`,
        null,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }

  deleteAdmin(name: string): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/admins/${name}`)
    );
  }

  getAdmins(): Promise<string[]> {
    return firstValueFrom(
      this.httpClient.get<string[]>(`${this.baseUrl}/api/admins`)
    );
  }
}
