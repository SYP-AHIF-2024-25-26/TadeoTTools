import { inject, Injectable } from '@angular/core';
import { StopGroup } from '@/shared/models/types';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from '@/app.config';

@Injectable({
  providedIn: 'root',
})
export class StopGroupService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getStopGroups(): Promise<StopGroup[]> {
    return firstValueFrom(
      this.httpClient.get<StopGroup[]>(`${this.baseUrl}/api/groups`)
    );
  }

  getStopGroupById(id: number): Promise<StopGroup | undefined> {
    return firstValueFrom(
      this.httpClient.get<StopGroup>(`${this.baseUrl}/api/groups/${id}`)
    );
  }

  updateStopGroupOrder(stopGroups: number[]): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/groups/order`, stopGroups)
    );
  }

  addStopGroup(stopGroup: StopGroup): Promise<StopGroup> {
    return firstValueFrom(
      this.httpClient.post<StopGroup>(`${this.baseUrl}/api/groups`, stopGroup)
    );
  }

  updateStopGroup(stopGroup: StopGroup): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/groups`, stopGroup)
    );
  }

  deleteStopGroup(stopGroupID: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/groups/${stopGroupID}`)
    );
  }
}
