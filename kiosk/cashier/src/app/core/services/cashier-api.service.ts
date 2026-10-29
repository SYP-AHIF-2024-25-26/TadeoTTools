import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, timeout } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import { Buffet, OrderSubmission } from '@shared/models/types';
import { SEND_TIMEOUT_MS } from '@shared/constants';

/**
 * `GET /v1/buffets`, in the shape of the legacy `GET /api/Buffets`. Only buffets
 * with products on the menu are listed. The description is free text and not shown.
 */
interface BuffetDto {
  id: number;
  location: string;
  products: {
    id: number;
    name: string;
    /** Cents. */
    price: number;
    measure: string;
    rank: number;
  }[];
}

/** The backend endpoints the kiosk uses; both need the login (`authInterceptor`). */
@Injectable({
  providedIn: 'root',
})
export class CashierApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  /** All buffets with their products, already in counter order. */
  getBuffets(): Promise<Buffet[]> {
    return firstValueFrom(
      this.http.get<BuffetDto[]>(`${this.baseUrl}/v1/buffets`).pipe(
        map((buffets) =>
          buffets.map((b) => ({
            id: b.id,
            location: b.location.trim(),
            products: b.products
              .map((p) => ({
                id: p.id,
                name: p.name.trim(),
                price: p.price,
                measure: p.measure.trim(),
                rank: p.rank,
              }))
              .sort((x, y) => x.rank - y.rank),
          }))
        )
      )
    );
  }

  /** Answers 200 also for a sale already stored, so a retry never counts twice. */
  submitOrder(order: OrderSubmission): Promise<unknown> {
    return firstValueFrom(
      this.http
        .post(`${this.baseUrl}/v1/orders`, order, { responseType: 'text' })
        .pipe(timeout(SEND_TIMEOUT_MS))
    );
  }
}
