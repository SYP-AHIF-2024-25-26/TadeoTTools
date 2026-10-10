import { computed, inject, Injectable, signal } from '@angular/core';
import { ResultPath, StatisticsApiService } from './statistics-api.service';
import { REFRESH_MS, RETRY_MS, STATISTICS_CACHE_KEY } from '@shared/constants';
import {
  Statistics,
  StatisticsKey,
  VisitorCount,
  VisitorResult,
} from '@shared/types';

const RESULT_PATHS: Record<Exclude<StatisticsKey, 'count'>, ResultPath> = {
  byTime: 'bytime',
  departments: 'departmentcount',
  reasons: 'reasoncount',
  schoolTypes: 'schooltypecount',
  districts: 'districtcount',
  gender: 'gendercount',
};

interface Cached {
  data: Statistics;
  loadedAt: string;
}

/**
 * The visitor statistics, loaded from the legacy backend every minute and
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
  /** When every endpoint last answered; a partly failed refresh keeps the older time. */
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
    const keys = Object.keys(RESULT_PATHS) as (keyof typeof RESULT_PATHS)[];
    const [count, ...results] = await Promise.allSettled([
      this.api.getCount(),
      ...keys.map((key) => this.api.getResults(RESULT_PATHS[key])),
    ]);

    const previous = this.cached()?.data;
    const fresh: Partial<Statistics> = {};
    if (count.status === 'fulfilled' && isCount(count.value)) {
      fresh.count = count.value;
    }
    keys.forEach((key, i) => {
      const result = results[i];
      if (result.status === 'fulfilled' && isResultList(result.value)) {
        fresh[key] = result.value;
      }
    });

    const complete = Object.keys(fresh).length === keys.length + 1;
    if (!complete) {
      console.warn('Statistics only partly loaded, keeping the rest', results);
    }
    // A partial answer only fills in what is there; the first data must be complete.
    if (!previous && !complete) return;

    const next: Cached = {
      data: { ...(previous as Statistics), ...fresh },
      loadedAt: complete
        ? new Date().toISOString()
        : (this.cached()?.loadedAt ?? new Date().toISOString()),
    };
    this.cached.set(next);
    writeCache(next);
  }
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
    return cached?.data && cached.loadedAt ? cached : null;
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
