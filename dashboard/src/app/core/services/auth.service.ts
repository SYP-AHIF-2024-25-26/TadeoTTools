import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from '../../app.config';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  async checkUserRole(
    performCall: string,
    expectedRole: string
  ): Promise<boolean> {
    try {
      const roleResponse = await this.performCall(performCall);
      if (!roleResponse) {
        return false;
      }
      return roleResponse.toLowerCase().includes(expectedRole);
    } catch (error) {
      return false;
    }
  }

  performCall(action: string): Promise<string> {
    const route = `${this.baseUrl}/users/${action}`;
    return firstValueFrom(this.httpClient.get(route, { responseType: 'text' }));
  }
}
