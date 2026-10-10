import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, timeout } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import { Buffet, OrderSubmission } from '@shared/models/types';
import { SEND_TIMEOUT_MS } from '@shared/constants';

/**
 * `GET /api/Buffets` as the legacy backend sends it. It also has a free-text
 * `description` (left from an earlier event) and cash movements; neither is used.
 */
interface BuffetDto {
  id: number;
  location: string | null;
  products: {
    id: number;
    name: string | null;
    price: number;
    measure: string | null;
    rank: number;
  }[];
}

/** The endpoints of the legacy TadeoT backend that the kiosk uses; none needs a login. */
@Injectable({
  providedIn: 'root',
})
export class CashierApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  /** All buffets with their products, already in counter order. */
  getBuffets(): Promise<Buffet[]> {
    return firstValueFrom(
      this.http.get<BuffetDto[]>(`${this.baseUrl}/api/Buffets`).pipe(
        map((buffets) =>
          buffets.map((b) => ({
            id: b.id,
            location: (b.location ?? '').trim(),
            products: b.products
              .map((p) => ({
                id: p.id,
                name: (p.name ?? '').trim(),
                // A double in the database; the legacy admin stores cents.
                price: Math.round(p.price),
                measure: (p.measure ?? '').trim(),
                rank: p.rank,
              }))
              .sort((x, y) => x.rank - y.rank),
          }))
        )
      )
    );
  }

  submitOrder(order: OrderSubmission): Promise<unknown> {
    return firstValueFrom(
      this.http
        .post(`${this.baseUrl}/api/orders`, order, { responseType: 'text' })
        .pipe(timeout(SEND_TIMEOUT_MS))
    );
  }
}
