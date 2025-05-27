import { inject, Injectable } from '@angular/core';
import { Stop, StopOfStudent, StopWithoutOrders, Info } from './types';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from './app.config';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root',
})
export class StopService {
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);
  private readonly infoStore = inject(InfoStore);

  constructor() {}

  public async getStops(): Promise<Stop[]> {
    try {
      return await firstValueFrom(this.httpClient.get<Stop[]>(this.baseUrl + '/api/stops'));
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to get stops' });
      throw error;
    }
  }

  public async getStopsOfStudent(): Promise<StopOfStudent[]> {
    try {
      return await firstValueFrom(this.httpClient.get<StopOfStudent[]>(this.baseUrl + '/stops/correlating'));
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to get stops of student' });
      throw error;
    }
  }

  async addStop(stop: Stop) {
    try {
      const result = await firstValueFrom(this.httpClient.post<Stop>(this.baseUrl + '/api/stops', stop));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully added stop' });
      return result;
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to add stop' });
      throw error;
    }
  }

  async updateStop(stop: StopWithoutOrders) {
    try {
      await firstValueFrom(this.httpClient.put(this.baseUrl + `/api/stops`, stop));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully updated stop' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to update stop' });
      throw error;
    }
  }
  async updateStopWithoutOrder(stop: StopWithoutOrders) {
    try {
      await firstValueFrom(this.httpClient.put(this.baseUrl + `/api/stops?updateOrder=false`, stop));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully updated stop without order' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to update stop without order' });
      throw error;
    }
  }

  async deleteStop(id: number) {
    try {
      await firstValueFrom(this.httpClient.delete(this.baseUrl + `/api/stops/${id}`));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully deleted stop' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to delete stop' });
      throw error;
    }
  }

  async getStopDataFile(): Promise<Blob> {
    return firstValueFrom(this.httpClient.get(this.baseUrl + '/api/stops/csv', {
      responseType: 'blob'
    }));
  }
}
