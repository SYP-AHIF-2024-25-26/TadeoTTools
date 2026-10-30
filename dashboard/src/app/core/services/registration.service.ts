import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { BASE_URL } from '@/app.config';
import {
  City,
  DeleteVisitorsResult,
  District,
  ImportResult,
  RegistrationOptionKind,
  RegistrationOptions,
  SaveCityRequest,
  SaveDistrictRequest,
  VisitorSummary,
} from '@/shared/models/types';

// Towns, districts, choice lists, registrations and photos of the registration kiosk (admin only).
@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = inject(BASE_URL);

  getDistricts(): Promise<District[]> {
    return firstValueFrom(
      this.httpClient.get<District[]>(`${this.baseUrl}/api/districts`)
    );
  }

  addDistrict(district: SaveDistrictRequest): Promise<District> {
    return firstValueFrom(
      this.httpClient.post<District>(`${this.baseUrl}/api/districts`, district)
    );
  }

  updateDistrict(id: number, district: SaveDistrictRequest): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/districts/${id}`, district)
    );
  }

  deleteDistrict(id: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/districts/${id}`)
    );
  }

  getCities(): Promise<City[]> {
    return firstValueFrom(
      this.httpClient.get<City[]>(`${this.baseUrl}/api/cities`)
    );
  }

  addCity(city: SaveCityRequest): Promise<City> {
    return firstValueFrom(
      this.httpClient.post<City>(`${this.baseUrl}/api/cities`, city)
    );
  }

  updateCity(id: number, city: SaveCityRequest): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/cities/${id}`, city)
    );
  }

  deleteCity(id: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/cities/${id}`)
    );
  }

  getOptions(): Promise<RegistrationOptions> {
    return firstValueFrom(
      this.httpClient.get<RegistrationOptions>(
        `${this.baseUrl}/api/registration-options`
      )
    );
  }

  updateOptions(kind: RegistrationOptionKind, names: string[]): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(
        `${this.baseUrl}/api/registration-options/${kind}`,
        names
      )
    );
  }

  getVisitorSummary(): Promise<VisitorSummary> {
    return firstValueFrom(
      this.httpClient.get<VisitorSummary>(
        `${this.baseUrl}/api/visitors/summary`
      )
    );
  }

  getVisitorsFile(): Promise<Blob> {
    return this.getFile('/api/visitors/csv');
  }

  getPhotosFile(): Promise<Blob> {
    return this.getFile('/api/visitor-photos/zip');
  }

  deleteVisitors(): Promise<DeleteVisitorsResult> {
    return firstValueFrom(
      this.httpClient.delete<DeleteVisitorsResult>(
        `${this.baseUrl}/api/visitors`
      )
    );
  }

  deletePhotos(): Promise<DeleteVisitorsResult> {
    return firstValueFrom(
      this.httpClient.delete<DeleteVisitorsResult>(
        `${this.baseUrl}/api/visitor-photos`
      )
    );
  }

  // The csv files have the same columns for export and import.
  // path: '/api/districts/csv', '/api/cities/csv' or '/api/registration-options/<kind>/csv'
  getCsvFile(path: string): Promise<Blob> {
    return this.getFile(path);
  }

  // The file goes as the request body; the backend reads UTF-8 and Excel's ANSI.
  importCsv(path: string, file: File): Promise<ImportResult> {
    return firstValueFrom(
      this.httpClient
        .post<{ imported: number }>(`${this.baseUrl}${path}`, file, {
          headers: { 'Content-Type': 'text/csv' },
        })
        .pipe(map((r) => ({ added: r.imported, skipped: 0 })))
    );
  }

  private getFile(path: string): Promise<Blob> {
    return firstValueFrom(
      this.httpClient.get(`${this.baseUrl}${path}`, { responseType: 'blob' })
    );
  }
}
