import { computed, inject, Injectable, signal } from '@angular/core';
import { StatisticsApiService } from './statistics-api.service';
import { REFRESH_MS, RETRY_MS, STATISTICS_CACHE_KEY } from '@shared/constants';
import {
  Statistics,
  VisitorCount,
  VisitorHour,
  VisitorResult,
} from '@shared/types';

interface Cached {
  data: Statistics;
  loadedAt: string;
}

/**
 * The visitor statistics, loaded from the backend every minute and
 * kept in localStorage. Nobody watches over the projector, so a failed
 * request is never shown: the last data stays, and only "Stand" ages.
 */
@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  private api = inject(StatisticsApiService);
  private running: Promise<void> | undefined;

  private cached = signal<Cached | null>(readCache());
  readonly data = computed(() => this.cached()?.data ?? null);
  /** When the backend last answered; a failed refresh keeps the older time. */
  readonly loadedAt = computed(() => {
    const at = this.cached()?.loadedAt;
    return at ? new Date(at) : null;
  });

  constructor() {
    window.addEventListener('online', () => this.load());
    setInterval(() => this.load(), REFRESH_MS);
    // Without any data there is nothing to show, so it tries more often.
    setInterval(() => {
      if (!this.data()) this.load();
    }, RETRY_MS);
  }

  load(): Promise<void> {
    this.running ??= this.fetch().finally(() => (this.running = undefined));
    return this.running;
  }

  private async fetch(): Promise<void> {
    let data: unknown;
    try {
      data = await this.api.getStatistics();
    } catch (err) {
      console.warn(
        'Statistics could not be loaded, keeping the last data',
        err
      );
      return;
    }
    if (!isStatistics(data)) {
      console.warn(
        'Statistics have an unexpected shape, keeping the last data',
        data
      );
      return;
    }

    const next: Cached = { data, loadedAt: new Date().toISOString() };
    this.cached.set(next);
    writeCache(next);
  }
}

function isStatistics(value: unknown): value is Statistics {
  const v = value as Statistics | null;
  return (
    isCount(v?.count) &&
    isHourList(v?.byTime) &&
    isResultList(v?.departments) &&
    isResultList(v?.reasons) &&
    isResultList(v?.schoolTypes) &&
    isResultList(v?.districts) &&
    isResultList(v?.gender)
  );
}

function isHourList(value: unknown): value is VisitorHour[] {
  return (
    Array.isArray(value) &&
    value.every(
      (r: VisitorHour | null) =>
        typeof r?.date === 'string' &&
        typeof r?.hour === 'number' &&
        typeof r?.count === 'number'
    )
  );
}

function isCount(value: unknown): value is VisitorCount {
  const v = value as VisitorCount | null;
  return typeof v?.count === 'number' && typeof v?.adultsCount === 'number';
}

function isResultList(value: unknown): value is VisitorResult[] {
  return (
    Array.isArray(value) &&
    value.every(
      (r: VisitorResult | null) =>
        typeof r?.category === 'string' && typeof r?.count === 'number'
    )
  );
}

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(STATISTICS_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as Cached;
    // Data cached from the legacy backend has another byTime shape and is dropped.
    return isStatistics(cached?.data) && cached.loadedAt ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(cached: Cached): void {
  try {
    localStorage.setItem(STATISTICS_CACHE_KEY, JSON.stringify(cached));
  } catch (err) {
    console.warn('Statistics could not be cached', err);
  }
}
