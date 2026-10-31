import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BASE_URL } from '@/app.config';
import { MapPlace, MapSuggestion } from '@/shared/models/types';

export type SaveMapPlace = Omit<MapPlace, 'id' | 'stopIds'>;

// The rooms and spots on the floor plans and which stops are in them.
@Injectable({
  providedIn: 'root',
})
export class MapService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getPlaces(): Promise<MapPlace[]> {
    return firstValueFrom(
      this.httpClient.get<MapPlace[]>(`${this.baseUrl}/api/map-places`)
    );
  }

  addPlace(place: SaveMapPlace): Promise<MapPlace> {
    return firstValueFrom(
      this.httpClient.post<MapPlace>(`${this.baseUrl}/api/map-places`, place)
    );
  }

  updatePlace(id: number, place: SaveMapPlace): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(`${this.baseUrl}/api/map-places/${id}`, place)
    );
  }

  deletePlace(id: number): Promise<void> {
    return firstValueFrom(
      this.httpClient.delete<void>(`${this.baseUrl}/api/map-places/${id}`)
    );
  }

  setPlacesOfStop(stopId: number, placeIds: number[]): Promise<void> {
    return firstValueFrom(
      this.httpClient.put<void>(
        `${this.baseUrl}/api/map-places/stops/${stopId}`,
        placeIds
      )
    );
  }

  getSuggestions(): Promise<MapSuggestion[]> {
    return firstValueFrom(
      this.httpClient.get<MapSuggestion[]>(
        `${this.baseUrl}/api/map-places/suggestions`
      )
    );
  }

  applySuggestions(): Promise<number> {
    return firstValueFrom(
      this.httpClient.post<number>(
        `${this.baseUrl}/api/map-places/suggestions/apply`,
        null
      )
    );
  }
}
