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

  async addAdmin(name: string) {
    try {
      await firstValueFrom(
        this.httpClient.post(`${this.baseUrl}/api/admins?name=${encodeURIComponent(name)}`, null, {
          headers: { 'Content-Type': 'application/json' },
        })
      );
    } catch (error) {
      throw error;
    }
  }

  async deleteAdmin(name: string) {
    try {
      await firstValueFrom(this.httpClient.delete(this.baseUrl + `/api/admins/${name}`));
    } catch (error) {
      throw error;
    }
  }

  async getAdmins(): Promise<string[]> {
    try {
      return await firstValueFrom(this.httpClient.get<string[]>(this.baseUrl + '/api/admins'));
    } catch (error) {
      throw error;
    }
  }
}
