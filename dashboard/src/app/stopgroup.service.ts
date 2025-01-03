import {inject, Injectable} from '@angular/core';
import {Stop, StopGroup} from './types';
import {StopService} from './stop.service';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom, map} from 'rxjs';
import {BASE_URL} from './app.config';
import {StopGroupsComponent} from "./stopgroups/stopgroups.component";

@Injectable({
  providedIn: 'root',
})
export class StopGroupService {
  stopService = inject(StopService);
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  async getStopGroups(): Promise<StopGroup[]> {
    return firstValueFrom(
      this.httpClient.get<StopGroup[]>(this.baseUrl + '/api/groups', {
        headers: {
          'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
        },
      })
    );
  }

  updateStopGroupOrder(stopGroups: number[]) {
    firstValueFrom(
      this.httpClient.put(
        this.baseUrl + `/api/groups/order`,
        {
          order: stopGroups,
        },
        {
          headers: {
            'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
          },
        }
      )
    );
  }

  async addStopGroup(stopGroup: {
    name: string;
    description: string;
    isPublic: boolean;
  }) {
    await firstValueFrom(
      this.httpClient.post(this.baseUrl + '/api/groups', stopGroup, {
        headers: {
          'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
        },
      })
    );
  }

  async updateStopGroup(stopGroup: StopGroup) {
    console.log(typeof(stopGroup.isPublic));
    await firstValueFrom(
      this.httpClient.put(
        this.baseUrl + `/api/groups/${stopGroup.id}`,
        stopGroup,
        {
          headers: {
            'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
          },
        }
      )
    );
  }

  async deleteStopGroup(stopGroupID: number) {
    await firstValueFrom(
      this.httpClient.delete(this.baseUrl + `/api/groups/${stopGroupID}`, {
        headers: {
          'X-Api-Key': localStorage.getItem('API_KEY') ?? '',
        },
      })
    );
  }
}
