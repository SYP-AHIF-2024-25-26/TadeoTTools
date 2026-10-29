import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { BuffetService } from '@/core/services/buffet.service';
import { SalesStatistics } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';
import { euro } from '../money';

// Read-only figures from the stored sales: key numbers, sales per hour for each
// day, and the products by quantity. Loads whenever the tab is opened.
@Component({
  selector: 'app-buffet-statistics',
  templateUrl: './buffet-statistics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, PercentPipe],
})
export class BuffetStatisticsComponent {
  private buffetService = inject(BuffetService);

  protected readonly euro = euro;
  protected readonly plural = plural;

  protected statistics = signal<SalesStatistics | null>(null);
  protected loading = signal(true);
  protected loadFailed = signal(false);

  // One scale for every day, so the days can be compared at a glance.
  protected hourMax = computed(() =>
    Math.max(
      1,
      ...(this.statistics()?.days ?? []).flatMap((d) =>
        d.hours.map((h) => h.orderCount)
      )
    )
  );

  protected days = computed(() =>
    (this.statistics()?.days ?? []).map((day) => {
      const peak = Math.max(...day.hours.map((h) => h.orderCount));
      return {
        ...day,
        // The first hour with the most sales gets the one direct label.
        peakHour: day.hours.find((h) => h.orderCount === peak)?.hour,
      };
    })
  );

  protected productMax = computed(() =>
    Math.max(1, ...(this.statistics()?.products ?? []).map((p) => p.quantity))
  );

  // Revenue of the products alone, before vouchers, for the shares.
  protected productRevenue = computed(() =>
    (this.statistics()?.products ?? []).reduce(
      (sum, p) => sum + p.revenueCents,
      0
    )
  );

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.statistics.set(await this.buffetService.getSalesStatistics());
      this.loadFailed.set(false);
    } catch (error) {
      console.error('Failed to load the sales statistics', error);
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected hourLabel(hour: number): string {
    return `${hour}:00–${hour + 1}:00`;
  }
}
