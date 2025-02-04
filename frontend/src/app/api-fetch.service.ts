import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Division, Stop, StopGroup } from './types';
import { BASE_URL } from './app.config';

@Injectable({
  providedIn: 'root',
})
export class ApiFetchService {
  private http = inject(HttpClient);
  private baseURL = inject(BASE_URL);

  public async getDivisions(): Promise<Division[]> {
    return firstValueFrom(this.http.get<Division[]>(this.baseURL + '/v1/divisions'));
  }

  public async getStopGroups(): Promise<StopGroup[]> {
    return firstValueFrom(this.http.get<StopGroup[]>(this.baseURL + '/v1/groups'));
  }

  public async getStopsOfGroup(groupID: number): Promise<Stop[]> {
    return (await firstValueFrom(this.http.get<Stop[]>(this.baseURL + `/v1/stops`))).filter((stop) => stop.stopGroupIds.includes(groupID));
  }
}
