import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from '@/app.config';
import { PhotoViewer, VisitorPhoto } from '@/shared/models/types';

// The visitor photos for the Roboterführerschein stop: its stop managers and
// accepted students, and admins (policy IsPhotoViewer).
@Injectable({
  providedIn: 'root',
})
export class VisitorPhotoService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = inject(BASE_URL);

  // null without access (403); atStop is false for admins who are not at the stop.
  async getPhotoViewer(): Promise<PhotoViewer | null> {
    try {
      return await firstValueFrom(
        this.httpClient.get<PhotoViewer>(
          `${this.baseUrl}/users/is-photo-viewer`
        )
      );
    } catch {
      return null;
    }
  }

  // All photos, newest first.
  getIndex(): Promise<VisitorPhoto[]> {
    return firstValueFrom(
      this.httpClient.get<VisitorPhoto[]>(`${this.baseUrl}/api/visitor-photos`)
    );
  }

  // Same name as the backend's file, Visitor_0001.png (at least four digits).
  fileName(id: number): string {
    return `Visitor_${String(id).padStart(4, '0')}.png`;
  }

  // The files are public, so an <img> can load them without the token.
  url(id: number): string {
    return `${this.baseUrl}/visitor-photos/${this.fileName(id)}`;
  }

  getFile(id: number): Promise<Blob> {
    return firstValueFrom(
      this.httpClient.get(this.url(id), { responseType: 'blob' })
    );
  }

  getZipFile(): Promise<Blob> {
    return firstValueFrom(
      this.httpClient.get(`${this.baseUrl}/api/visitor-photos/zip`, {
        responseType: 'blob',
      })
    );
  }
}
