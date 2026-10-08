import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from '@/app.config';
import { Overview } from '@/shared/models/types';

@Injectable({
  providedIn: 'root',
})
export class OverviewService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getOverview(): Promise<Overview> {
    return firstValueFrom(
      this.httpClient.get<Overview>(`${this.baseUrl}/api/overview`)
    );
  }
}
