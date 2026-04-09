import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '@/app.config';
import { firstValueFrom } from 'rxjs';
import { FeatureFlag } from '@/shared/models/types';

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private http = inject(HttpClient);
  private baseURL = inject(BASE_URL);

  async getShowCountdown(): Promise<FeatureFlag> {
    return firstValueFrom(
      this.http.get<FeatureFlag>(`${this.baseURL}/featureflags/showCountdown`)
    );
  }

  async updateShowCountdown(isEnabled: boolean, value: string): Promise<boolean> {
    return firstValueFrom(
      this.http.put<boolean>(
        `${this.baseURL}/featureflags/showCountdown`,
        {"isEnabled": isEnabled, "value": value}
      )
    );
  }
}
