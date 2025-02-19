import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BASE_URL } from './app.config';
import { firstValueFrom } from 'rxjs';
import { Division } from './types';

@Injectable({
  providedIn: 'root',
})
export class DivisionService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = inject(BASE_URL);

  constructor() {}

  public async getDivisions(): Promise<Division[]> {
    return firstValueFrom(
      this.httpClient.get<Division[]>(this.baseUrl + '/divisions')
    );
  }

  async addDivision(division: { name: string; color: string }): Promise<void> {
    await firstValueFrom(
      this.httpClient.post(
        `${this.baseUrl}/api/divisions`,
        {
          name: division.name,
          color: division.color,
        }
      )
    );
  }

  async updateDivisionImg(id: number, image: File): Promise<void> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('image', image);
    await firstValueFrom(
      this.httpClient.put(`${this.baseUrl}/api/divisions/image`, formData)
    );
  }

  async updateDivision(division: Division): Promise<void> {
    await firstValueFrom(
      this.httpClient.put(`${this.baseUrl}/api/divisions`, division)
    );
  }

  async deleteDivision(divisionId: number): Promise<void> {
    await firstValueFrom(
      this.httpClient.delete(`${this.baseUrl}/api/divisions/${divisionId}`)
    );
  }
  async deleteDivisionImg(divisionId: number): Promise<void> {
    await firstValueFrom(
      this.httpClient.delete(
        `${this.baseUrl}/api/divisions/${divisionId}/image`
      )
    );
  }
}
