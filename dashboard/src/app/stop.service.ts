import { inject, Injectable } from '@angular/core';
import { Stop, StopOfStudent, StopWithoutOrders } from './types';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from './app.config';

@Injectable({
  providedIn: 'root',
})
export class StopService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getStops(): Promise<Stop[]> {
    return firstValueFrom(
      this.httpClient.get<Stop[]>(`${this.baseUrl}/api/stops`)
    );
  }

  getStopsOfStudent(): Promise<StopOfStudent[]> {
    return firstValueFrom(
      this.httpClient.get<StopOfStudent[]>(`${this.baseUrl}/stops/correlating`)
    );
  }

  addStop(stop: Stop): Promise<Stop> {
    return firstValueFrom(
      this.httpClient.post<Stop>(`${this.baseUrl}/api/stops`, stop)
    );
  }

  updateStop(stop: StopWithoutOrders): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/stops`, stop)
    );
  }

  updateStopWithoutOrder(stop: StopWithoutOrders): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/stops?updateOrder=false`, stop)
    );
  }

  deleteStop(id: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/stops/${id}`)
    );
  }

  getStopDataFile(): Promise<Blob> {
    return firstValueFrom(
      this.httpClient.get(`${this.baseUrl}/api/stops/csv`, {
        responseType: 'blob'
      })
    );
  }
}
