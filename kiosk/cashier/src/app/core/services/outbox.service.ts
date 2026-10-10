import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CashierApiService } from './cashier-api.service';
import { PendingSale } from '@shared/models/types';
import { OUTBOX_KEY, OUTBOX_RETRY_MS } from '@shared/constants';

/**
 * Every completed sale is written here first and then sent, oldest first.
 * Whatever cannot be sent stays in localStorage and is retried, so the buffet
 * keeps selling through a Wi-Fi gap. A sale the server refuses is not dropped:
 * it is real money, so it waits for the student to send it again or remove it.
 */
@Injectable({
  providedIn: 'root',
})
export class OutboxService {
  private api = inject(CashierApiService);
  private entries = signal<PendingSale[]>(read());

  /** Sales waiting to be sent. */
  readonly waiting = computed(() => this.entries().filter((e) => !e.rejected));
  /** Sales the server refused. */
  readonly rejected = computed(() => this.entries().filter((e) => e.rejected));
  readonly sending = signal(false);
  /** True after a send failed for lack of a connection, until one succeeds. */
  readonly offline = signal(false);

  constructor() {
    window.addEventListener('online', () => this.flush());
    setInterval(() => {
      if (this.waiting().length > 0) this.flush();
    }, OUTBOX_RETRY_MS);
    this.flush();
  }

  add(sale: PendingSale): void {
    this.write([...this.entries(), sale]);
    this.flush();
  }

  /** Puts refused sales back in the queue (e.g. after the buffet was fixed in the admin). */
  retryRejected(): void {
    this.write(
      this.entries().map(({ order, lines, total }) => ({ order, lines, total }))
    );
    this.flush();
  }

  /** Removes a refused sale for good; the student has noted it elsewhere. */
  discard(orderNumber: string): void {
    this.write(
      this.entries().filter((e) => e.order.orderNumber !== orderNumber)
    );
  }

  /**
   * Sends the waiting sales oldest first, including any completed meanwhile;
   * stops at the first network failure.
   */
  async flush(): Promise<void> {
    if (this.sending()) return;
    this.sending.set(true);
    try {
      let sale: PendingSale | undefined;
      while ((sale = this.waiting()[0])) {
        try {
          await this.api.submitOrder(sale.order);
          const sent = sale.order.orderNumber;
          this.write(
            this.entries().filter((e) => e.order.orderNumber !== sent)
          );
        } catch (err) {
          if (!isRefused(err)) {
            // No connection, a timeout or a server error: try again later.
            this.offline.set(true);
            return;
          }
          console.error('Sale refused by the backend', sale, err);
          this.mark(sale.order.orderNumber, err);
        }
      }
      this.offline.set(false);
    } finally {
      this.sending.set(false);
    }
  }

  private mark(orderNumber: string, err: HttpErrorResponse): void {
    const message = typeof err.error === 'string' ? err.error : err.message;
    this.write(
      this.entries().map((e) =>
        e.order.orderNumber === orderNumber
          ? { ...e, rejected: { status: err.status, message } }
          : e
      )
    );
  }

  private write(entries: PendingSale[]): void {
    this.entries.set(entries);
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
    } catch (err) {
      // Storage full or blocked: the sales stay in memory and are still sent,
      // they only would not survive a reload.
      console.error('Sales outbox could not be stored', err);
    }
  }
}

function read(): PendingSale[] {
  try {
    const stored = localStorage.getItem(OUTBOX_KEY);
    return stored ? (JSON.parse(stored) as PendingSale[]) : [];
  } catch {
    return [];
  }
}

/**
 * 400 (invalid order) and 404 (buffet deleted) would fail forever on a retry.
 * Everything else, including 5xx, may be temporary.
 */
function isRefused(err: unknown): err is HttpErrorResponse {
  return (
    err instanceof HttpErrorResponse &&
    (err.status === 400 || err.status === 404)
  );
}
