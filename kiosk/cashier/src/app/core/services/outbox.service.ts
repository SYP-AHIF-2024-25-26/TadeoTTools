import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AccessService } from './access.service';
import { CashierApiService } from './cashier-api.service';
import { PendingSale } from '@shared/models/types';
import { OUTBOX_KEY, OUTBOX_RETRY_MS } from '@shared/constants';

/**
 * Every completed sale is written here first and then sent, oldest first.
 * Whatever cannot be sent stays in localStorage and is retried, so the buffet
 * keeps selling through a Wi-Fi gap. A sale the server refuses is not dropped:
 * it is real money, so it waits for the student to send it again or remove it.
 * Sending needs the login; without it the sales wait until the next one.
 */
@Injectable({
  providedIn: 'root',
})
export class OutboxService {
  private api = inject(CashierApiService);
  private access = inject(AccessService);
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
    if (this.sending() || this.access.state() !== 'granted') return;
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
          if (isLoginLost(err)) {
            // The access service sends the student to the login; the sale waits.
            return;
          }
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
    const message = serverMessage(err.error) ?? err.message;
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

/** 401: the login ran out; 403: the access was taken away. Neither is the sale's fault. */
function isLoginLost(err: unknown): boolean {
  return (
    err instanceof HttpErrorResponse &&
    (err.status === 401 || err.status === 403)
  );
}

/** The backend's reason: a JSON string ("Only one voucher per sale.") or ProblemDetails. */
function serverMessage(body: unknown): string | undefined {
  if (typeof body !== 'string' || body === '') return undefined;
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === 'string') return parsed;
    if (parsed && typeof parsed === 'object') {
      const { detail, title } = parsed as { detail?: unknown; title?: unknown };
      if (typeof detail === 'string') return detail;
      if (typeof title === 'string') return title;
    }
  } catch {
    // Not JSON: plain text.
  }
  return body;
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
