import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { BASE_URL } from '@/app.config';
import { Release } from '@/shared/models/types';

export const RELEASES_URL =
  'https://github.com/SYP-AHIF-2024-25-26/TadeoTTools/releases';

const RELEASES_API =
  'https://api.github.com/repos/SYP-AHIF-2024-25-26/TadeoTTools/releases?per_page=100';

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getBackendVersion(): Promise<string> {
    return firstValueFrom(
      this.httpClient
        .get<{ version: string }>(`${this.baseUrl}/api/version`)
        .pipe(map((response) => response.version))
    );
  }

  // Newest first. Public data of the public repository, read directly from GitHub.
  getReleases(): Promise<Release[]> {
    return firstValueFrom(this.httpClient.get<Release[]>(RELEASES_API));
  }
}
