import { inject, Injectable } from '@angular/core';
import { Stop, StopWithoutOrders } from './types';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from './app.config';

@Injectable({
  providedIn: 'root',
})
export class StopService {
  httpClient = inject(HttpClient);
  baseUrl = inject(BASE_URL);

  constructor() {}

  public async getStops(): Promise<Stop[]> {
    return firstValueFrom(
      this.httpClient.get<Stop[]>(this.baseUrl + '/api/stops')
    );
  }

  async addStop(stop: {
    name: string;
    description: string;
    roomNr: string;
    divisionIDs: number[];
    stopGroupIDs: number[];
  }) {
    await firstValueFrom(
      this.httpClient.post(this.baseUrl + '/api/stops', stop)
    );
  }

  async updateStop(stop: StopWithoutOrders) {
    await firstValueFrom(
      this.httpClient.put(this.baseUrl + `/api/stops`, stop)
    );
  }
  async updateStopWithoutOrder(stop: StopWithoutOrders) {
    await firstValueFrom(
      this.httpClient.put(this.baseUrl + `/api/stops?updateOrder=false`, stop)
    );
  }

  async deleteStop(id: number) {
    await firstValueFrom(
      this.httpClient.delete(this.baseUrl + `/api/stops/${id}`)
    );
  }
}
