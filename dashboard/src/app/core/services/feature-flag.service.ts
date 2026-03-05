import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '@/app.config';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private http = inject(HttpClient);
  private baseURL = inject(BASE_URL);

  async getShowCountdown(): Promise<boolean> {
    return firstValueFrom(
      this.http.get<boolean>(`${this.baseURL}/featureflags/showCountdown`)
    );
  }

  async updateShowCountdown(isEnabled: boolean): Promise<boolean> {
    return firstValueFrom(
      this.http.put<boolean>(
        `${this.baseURL}/featureflags/showCountdown`,
        {"isEnabled": isEnabled}
      )
    );
  }
}
