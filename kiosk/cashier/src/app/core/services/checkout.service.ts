import { inject, Injectable, signal } from '@angular/core';
import { CartService } from './cart.service';
import { CatalogService } from './catalog.service';
import { OutboxService } from './outbox.service';
import { TillTotalService } from './till-total.service';
import { LastSale } from '@shared/models/types';
import { DEVICE_ID_KEY, SEQUENCE_KEY } from '@shared/constants';

export type Screen = 'till' | 'pay';

/** Which screen is shown, and completing a sale. */
@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private cart = inject(CartService);
  private catalog = inject(CatalogService);
  private outbox = inject(OutboxService);
  private tillTotal = inject(TillTotalService);

  readonly screen = signal<Screen>('till');
  /** Shown on the till until the next product is tapped, so the change can still be read. */
  readonly lastSale = signal<LastSale | null>(null);

  pay(): void {
    if (this.cart.payable()) this.screen.set('pay');
  }

  back(): void {
    this.screen.set('till');
  }

  /** Records the sale on the tablet, queues it for the server and starts the next one. */
  complete(given: number | null): void {
    const buffet = this.catalog.buffet();
    if (!buffet || !this.cart.payable()) return;
    const lines = this.cart.lines();
    const total = this.cart.total();
    const orderNumber = nextOrderNumber();

    this.outbox.add({
      order: {
        buffetId: buffet.id,
        date: new Date().toISOString(),
        soldUnits: lines.map((l) => ({
          productId: l.product.id,
          amount: l.amount,
        })),
        orderNumber,
      },
      lines: lines.map((l) => ({ name: l.product.name, amount: l.amount })),
      total,
    });
    this.tillTotal.add(total);
    this.lastSale.set({ total, given, orderNumber });
    this.cart.clear();
    this.screen.set('till');
  }
}

/**
 * "K7Q2-0047": a random id per tablet and a running number. The legacy backend
 * does not check for duplicates; with this, a sale sent twice (the answer to the
 * first attempt got lost) can be found in the database (`Orders.OrderNumber`).
 */
function nextOrderNumber(): string {
  try {
    let device = localStorage.getItem(DEVICE_ID_KEY);
    if (!device) {
      device = Math.random()
        .toString(36)
        .slice(2, 6)
        .padEnd(4, '0')
        .toUpperCase();
      localStorage.setItem(DEVICE_ID_KEY, device);
    }
    const sequence = Number(localStorage.getItem(SEQUENCE_KEY) ?? '0') + 1;
    localStorage.setItem(SEQUENCE_KEY, String(sequence));
    return `${device}-${String(sequence).padStart(4, '0')}`;
  } catch {
    // Without storage the number is still unique enough to tell sales apart.
    return `X-${Date.now().toString(36).toUpperCase()}`;
  }
}
