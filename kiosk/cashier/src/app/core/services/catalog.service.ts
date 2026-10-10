import { computed, inject, Injectable, signal } from '@angular/core';
import { CashierApiService } from './cashier-api.service';
import { classify } from './failure';
import { Buffet, LoadFailure } from '@shared/models/types';
import {
  BUFFET_KEY,
  CATALOG_CACHE_KEY,
  CATALOG_REFRESH_MS,
  CATALOG_RETRY_MS,
} from '@shared/constants';

/**
 * Buffets and their products. Loaded from the backend and kept in
 * localStorage, so a restarted tablet can sell at once, even offline.
 * With one buffet it is used automatically; with several the tablet asks
 * once and remembers the choice.
 */
@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private api = inject(CashierApiService);
  private running: Promise<void> | undefined;

  readonly buffets = signal<Buffet[]>(readCache());
  private chosenId = signal<number | null>(readChoice());

  readonly ready = computed(() => this.buffets().length > 0);
  readonly hasChoice = computed(() => this.buffets().length > 1);
  /** The buffet this tablet sells for; null while it still has to be chosen. */
  readonly buffet = computed<Buffet | null>(() => {
    const buffets = this.buffets();
    if (buffets.length === 1) return buffets[0];
    return buffets.find((b) => b.id === this.chosenId()) ?? null;
  });

  /** True while the student switches to another buffet from the status strip. */
  readonly picking = signal(false);

  readonly loading = signal(false);
  readonly failure = signal<LoadFailure | null>(null);
  readonly lastAttempt = signal<Date | null>(null);

  constructor() {
    window.addEventListener('online', () => this.load());
    // Without products the tablet cannot sell at all, so it keeps trying.
    setInterval(() => {
      if (!this.ready()) this.load();
    }, CATALOG_RETRY_MS);
    setInterval(() => this.load(), CATALOG_REFRESH_MS);
  }

  load(): Promise<void> {
    this.running ??= this.fetch().finally(() => (this.running = undefined));
    return this.running;
  }

  choose(buffetId: number): void {
    this.chosenId.set(buffetId);
    this.picking.set(false);
    try {
      localStorage.setItem(BUFFET_KEY, String(buffetId));
    } catch (err) {
      console.warn('Buffet choice could not be stored', err);
    }
  }

  private async fetch(): Promise<void> {
    this.loading.set(true);
    try {
      const buffets = await this.api.getBuffets();
      this.buffets.set(buffets);
      this.failure.set(null);
      writeCache(buffets);
    } catch (err) {
      console.warn('Products could not be loaded, using cache', err);
      this.failure.set(classify(err));
    } finally {
      this.loading.set(false);
      this.lastAttempt.set(new Date());
    }
  }
}

function readCache(): Buffet[] {
  try {
    const cached = localStorage.getItem(CATALOG_CACHE_KEY);
    return cached ? (JSON.parse(cached) as Buffet[]) : [];
  } catch {
    return [];
  }
}

function writeCache(buffets: Buffet[]): void {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(buffets));
  } catch (err) {
    // Storage full or blocked: the products still work until the next reload.
    console.warn('Products could not be cached', err);
  }
}

function readChoice(): number | null {
  try {
    const stored = localStorage.getItem(BUFFET_KEY);
    return stored === null ? null : Number(stored);
  } catch {
    return null;
  }
}
