import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Info } from './types';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);
  private readonly infoStore = inject(InfoStore);

  constructor() {}

  async addAdmin(name: string) {
    try {
      await firstValueFrom(
        this.httpClient.post(`${this.baseUrl}/api/admins?name=${encodeURIComponent(name)}`, null, {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully added admin' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to add admin' });
      throw error;
    }
  }

  async deleteAdmin(name: string) {
    try {
      console.log(name);
      await firstValueFrom(this.httpClient.delete(this.baseUrl + `/api/admins/${name}`));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully deleted admin' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to delete admin' });
      throw error;
    }
  }

  async getAdmins(): Promise<string[]> {
    try {
      return await firstValueFrom(this.httpClient.get<string[]>(this.baseUrl + '/api/admins'));
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to get admins' });
      throw error;
    }
  }
}
