import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  getRating(stopId: number): number {
    const rating = localStorage.getItem(`rating_${stopId}`);
    if (rating) {
      return parseInt(rating, 10);
    }
    return 0;
  }

  setRating(stopId: number, rating: number): void {
    localStorage.setItem(`rating_${stopId}`, rating.toString());
  }
}
