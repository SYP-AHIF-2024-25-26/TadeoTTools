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

  getDivisions(): Promise<Division[]> {
    return firstValueFrom(
      this.httpClient.get<Division[]>(`${this.baseUrl}/divisions`)
    );
  }

  addDivision(division: { name: string; color: string }): Promise<Division> {
    return firstValueFrom(
      this.httpClient.post<Division>(`${this.baseUrl}/api/divisions`, {
        name: division.name,
        color: division.color,
      })
    );
  }

  updateDivisionImg(id: number, image: File): Promise<void> {
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('image', image);

    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/divisions/image`, formData)
    );
  }

  updateDivision(division: Division): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/divisions`, division)
    );
  }

  deleteDivision(divisionId: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(
        `${this.baseUrl}/api/divisions/${divisionId}`
      )
    );
  }

  deleteDivisionImg(divisionId: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(
        `${this.baseUrl}/api/divisions/${divisionId}/image`
      )
    );
  }

  getDivisionDataFile(): Promise<Blob> {
    return firstValueFrom(
      this.httpClient.get(`${this.baseUrl}/api/divisions/csv`, {
        responseType: 'blob',
      })
    );
  }
}
