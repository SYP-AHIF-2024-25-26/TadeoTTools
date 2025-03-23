import { inject, Injectable } from '@angular/core';
import { StopGroup } from './types';
import { StopService } from './stop.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { BASE_URL } from './app.config';

@Injectable({
  providedIn: 'root',
})
export class StopGroupService {
  stopService = inject(StopService);
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  async getStopGroups(): Promise<StopGroup[]> {
    return firstValueFrom(
      this.httpClient.get<StopGroup[]>(this.baseUrl + '/api/groups')
    );
  }

  updateStopGroupOrder(stopGroups: number[]) {
    firstValueFrom(
      this.httpClient.put(this.baseUrl + `/api/groups/order`, stopGroups)
    );
  }

  async addStopGroup(stopGroup: StopGroup) {
    return await firstValueFrom(
      this.httpClient.post<StopGroup>(this.baseUrl + '/api/groups', stopGroup)
    );
  }

  async updateStopGroup(stopGroup: StopGroup) {
    await firstValueFrom(
      this.httpClient.put(this.baseUrl + `/api/groups`, stopGroup)
    );
  }

  async deleteStopGroup(stopGroupID: number) {
    await firstValueFrom(
      this.httpClient.delete(this.baseUrl + `/api/groups/${stopGroupID}`)
    );
  }
}
