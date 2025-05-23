import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { firstValueFrom } from 'rxjs';
import { Division, Info } from './types';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root',
})
export class DivisionService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = inject(BASE_URL);
  private readonly infoStore = inject(InfoStore);

  constructor() {}

  public async getDivisions(): Promise<Division[]> {
    try {
      const result = await firstValueFrom(this.httpClient.get<Division[]>(this.baseUrl + '/divisions'));
      return result;
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to get divisions' });
      throw error;
    }
  }

  async addDivision(division: { name: string; color: string }): Promise<Division> {
    try {
      const result = await firstValueFrom(
        this.httpClient.post<Division>(`${this.baseUrl}/api/divisions`, {
          name: division.name,
          color: division.color,
        })
      );
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully added division' });
      return result;
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to add division' });
      throw error;
    }
  }

  async updateDivisionImg(id: number, image: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('id', id.toString());
      formData.append('image', image);
      await firstValueFrom(this.httpClient.put(`${this.baseUrl}/api/divisions/image`, formData));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully updated division image' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to update division image' });
      throw error;
    }
  }

  async updateDivision(division: Division): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.put(`${this.baseUrl}/api/divisions`, division));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully updated division' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to update division' });
      throw error;
    }
  }

  async deleteDivision(divisionId: number): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.delete(`${this.baseUrl}/api/divisions/${divisionId}`));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully deleted division' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to delete division' });
      throw error;
    }
  }
  
  async deleteDivisionImg(divisionId: number): Promise<void> {
    try {
      await firstValueFrom(this.httpClient.delete(`${this.baseUrl}/api/divisions/${divisionId}/image`));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully deleted division image' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to delete division image' });
      throw error;
    }
  }

  async getDivisionDataFile(): Promise<Blob> {
    return firstValueFrom(this.httpClient.get(this.baseUrl + '/api/divisions/csv', {
      responseType: 'blob'
    }));
  }
}
