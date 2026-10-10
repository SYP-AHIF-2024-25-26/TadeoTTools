import { Injectable, signal } from '@angular/core';
import { TillTotal } from '@shared/models/types';
import { TILL_TOTAL_KEY } from '@shared/constants';

/**
 * What this tablet has taken since the last reset, counted when a sale is
 * completed (sent or not). Helps to count the cash box at closing time.
 */
@Injectable({
  providedIn: 'root',
})
export class TillTotalService {
  readonly total = signal<TillTotal>(read());

  add(cents: number): void {
    this.write({
      ...this.total(),
      count: this.total().count + 1,
      cents: this.total().cents + cents,
    });
  }

  reset(): void {
    this.write(fresh());
  }

  private write(total: TillTotal): void {
    this.total.set(total);
    try {
      localStorage.setItem(TILL_TOTAL_KEY, JSON.stringify(total));
    } catch (err) {
      console.warn('Till total could not be stored', err);
    }
  }
}

function fresh(): TillTotal {
  return { since: new Date().toISOString(), count: 0, cents: 0 };
}

function read(): TillTotal {
  try {
    const stored = localStorage.getItem(TILL_TOTAL_KEY);
    return stored ? (JSON.parse(stored) as TillTotal) : fresh();
  } catch {
    return fresh();
  }
}
