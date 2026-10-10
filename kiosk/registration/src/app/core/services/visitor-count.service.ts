import { inject, Injectable, signal } from '@angular/core';
import { RegistrationApiService } from './registration-api.service';
import { VisitorCount } from '@shared/models/types';
import { COUNT_REFRESH_MS } from '@shared/constants';

/**
 * The counter for the students at the entrance. Its refresh doubles as the
 * connection check: when it fails, the status strip says the server is gone.
 */
@Injectable({
  providedIn: 'root',
})
export class VisitorCountService {
  private api = inject(RegistrationApiService);

  readonly count = signal<VisitorCount | null>(null);
  /** False after the last refresh failed. */
  readonly reachable = signal(true);

  start(): void {
    this.refresh();
    setInterval(() => this.refresh(), COUNT_REFRESH_MS);
    window.addEventListener('online', () => this.refresh());
    window.addEventListener('offline', () => this.reachable.set(false));
  }

  async refresh(): Promise<void> {
    try {
      this.count.set(await this.api.getCount());
      this.reachable.set(true);
    } catch (err) {
      console.warn('Visitor count could not be loaded', err);
      this.reachable.set(false);
    }
  }
}
