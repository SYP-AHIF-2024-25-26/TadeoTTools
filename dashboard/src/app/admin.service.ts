import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {

  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  constructor() {}

  async addAdmin(name: string) {
    await firstValueFrom(
      this.httpClient.post(
        `${this.baseUrl}/api/users/admins?name=${encodeURIComponent(name)}`,
        null,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      )
    );
  }

  async deleteAdmin(name: string) {
    await firstValueFrom(
      this.httpClient.delete(this.baseUrl + `/api/users/admins/${name}`)
    );
  }

  getAdmins(): Promise<string[]> {
    return firstValueFrom(
      this.httpClient.get<string[]>(this.baseUrl + '/api/users/admins'));
  }
}
