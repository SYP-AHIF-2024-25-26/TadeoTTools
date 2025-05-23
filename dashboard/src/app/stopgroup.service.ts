import { inject, Injectable } from '@angular/core';
import { StopGroup, Info } from './types';
import { StopService } from './stop.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { BASE_URL } from './app.config';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root',
})
export class StopGroupService {
  stopService = inject(StopService);
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);
  private readonly infoStore = inject(InfoStore);

  async getStopGroups(): Promise<StopGroup[]> {
    try {
      return await firstValueFrom(this.httpClient.get<StopGroup[]>(this.baseUrl + '/api/groups'));
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to get stop groups: ' + (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  async updateStopGroupOrder(stopGroups: number[]) {
    try {
      await firstValueFrom(this.httpClient.put(this.baseUrl + `/api/groups/order`, stopGroups));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully updated stop group order' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to update stop group order: ' + (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  async addStopGroup(stopGroup: StopGroup) {
    try {
      const result = await firstValueFrom(this.httpClient.post<StopGroup>(this.baseUrl + '/api/groups', stopGroup));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully added stop group' });
      return result;
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to add stop group: ' + (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  async updateStopGroup(stopGroup: StopGroup) {
    try {
      await firstValueFrom(this.httpClient.put(this.baseUrl + `/api/groups`, stopGroup));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully updated stop group' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to update stop group: ' + (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  async deleteStopGroup(stopGroupID: number) {
    try {
      await firstValueFrom(this.httpClient.delete(this.baseUrl + `/api/groups/${stopGroupID}`));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully deleted stop group' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to delete stop group: ' + (error instanceof Error ? error.message : String(error)) });
      throw error;
    }
  }

  async getStopGroupDataFile(): Promise<Blob> {
    return firstValueFrom(this.httpClient.get(this.baseUrl + '/api/groups/csv', {
      responseType: 'blob'
    }));
  }
}
