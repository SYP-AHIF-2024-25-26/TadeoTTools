import { computed, inject, Injectable, signal } from '@angular/core';
import { RegistrationApiService } from './registration-api.service';
import { classify } from './failure';
import { City, LoadFailure } from '@shared/models/types';
import { REFERENCE_CACHE_KEY, REFERENCE_RETRY_MS } from '@shared/constants';

interface ReferenceData {
  cities: City[];
  reasons: string[];
  schoolTypes: string[];
}

const EMPTY: ReferenceData = { cities: [], reasons: [], schoolTypes: [] };

/**
 * Towns, reasons for the visit and school types. Loaded from the backend and
 * kept in localStorage, so a restarted tablet can start a registration at once.
 * Saving still needs the backend.
 */
@Injectable({
  providedIn: 'root',
})
export class ReferenceDataService {
  private api = inject(RegistrationApiService);
  private running: Promise<void> | undefined;
  private data = signal<ReferenceData>(readCache());

  readonly cities = computed(() => this.data().cities);
  readonly reasons = computed(() => this.data().reasons);
  readonly schoolTypes = computed(() => this.data().schoolTypes);
  /** Towns by postcode, for the postcode pad. */
  readonly citiesByZip = computed(() => {
    const byZip = new Map<string, City[]>();
    for (const city of this.cities()) {
      const zip = city.zipCode.trim();
      byZip.set(zip, [...(byZip.get(zip) ?? []), city]);
    }
    for (const list of byZip.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    }
    return byZip;
  });
  readonly ready = computed(
    () =>
      this.cities().length > 0 &&
      this.reasons().length > 0 &&
      this.schoolTypes().length > 0
  );

  readonly loading = signal(false);
  readonly failure = signal<LoadFailure | null>(null);
  readonly lastAttempt = signal<Date | null>(null);

  constructor() {
    // Without the lists the tablet cannot be used at all, so it keeps trying.
    window.addEventListener('online', () => {
      if (!this.ready()) this.load();
    });
    setInterval(() => {
      if (!this.ready()) this.load();
    }, REFERENCE_RETRY_MS);
  }

  load(): Promise<void> {
    this.running ??= this.fetch().finally(() => (this.running = undefined));
    return this.running;
  }

  city(id: number | null): City | undefined {
    return id === null ? undefined : this.cities().find((c) => c.id === id);
  }

  private async fetch(): Promise<void> {
    this.loading.set(true);
    try {
      const [cities, reasons, schoolTypes] = await Promise.all([
        this.api.getCities(),
        this.api.getReasons(),
        this.api.getSchoolTypes(),
      ]);
      const data = { cities, reasons, schoolTypes };
      this.data.set(data);
      this.failure.set(null);
      writeCache(data);
    } catch (err) {
      console.warn('Reference data could not be loaded, using cache', err);
      this.failure.set(classify(err));
    } finally {
      this.loading.set(false);
      this.lastAttempt.set(new Date());
    }
  }
}

function readCache(): ReferenceData {
  try {
    const cached = localStorage.getItem(REFERENCE_CACHE_KEY);
    return cached
      ? { ...EMPTY, ...(JSON.parse(cached) as ReferenceData) }
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeCache(data: ReferenceData): void {
  try {
    localStorage.setItem(REFERENCE_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    // Storage full or blocked: the lists still work until the next reload.
    console.warn('Reference data could not be cached', err);
  }
}
