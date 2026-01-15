import { inject, Injectable } from '@angular/core';
import {
  StopManager,
  CreateStopManagerRequest,
  UpdateStopManagerRequest,
} from '@/shared/models/types';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from '@/app.config';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StopManagerService {
  private baseUrl = inject(BASE_URL);
  private httpClient = inject(HttpClient);

  getStopManagers() {
    return firstValueFrom(
      this.httpClient.get<StopManager[]>(`${this.baseUrl}/api/stopmanagers`)
    );
  }

  getStopManagerById(edufsUsername: string) {
    return firstValueFrom(
      this.httpClient.get<StopManager>(
        `${this.baseUrl}/api/stopmanagers/${edufsUsername}`
      )
    );
  }

  postStopManager(stopManager: CreateStopManagerRequest) {
    return firstValueFrom(
      this.httpClient.post<void>(
        `${this.baseUrl}/api/stopmanagers`,
        stopManager
      )
    );
  }

  deleteStopManager(edufsUsername: string) {
    return firstValueFrom(
      this.httpClient.delete<void>(
        `${this.baseUrl}/api/stopmanagers/${edufsUsername}`
      )
    );
  }

  updateStopManager(stopManager: UpdateStopManagerRequest) {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/stopmanagers`, stopManager)
    );
  }

  uploadStopManagersCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return firstValueFrom(
      this.httpClient.post<void>(
        `${this.baseUrl}/api/stopmanagers/upload`,
        formData
      )
    );
  }
}
