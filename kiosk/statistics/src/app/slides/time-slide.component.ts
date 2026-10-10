import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { formatCount } from '@shared/format';
import { Slide } from '@shared/types';

/**
 * Registrations per hour of the latest open day, one row of columns per day
 * on a shared hour axis and a shared scale. The busiest hour of each day is
 * its darkest column; the date stands at the start of the row.
 */
@Component({
  selector: 'app-time-slide',
  template: `
    <div class="flex h-full flex-col">
      <h1 class="slide-title">Anmeldungen pro Stunde</h1>
      <p class="slide-note">{{ note() }}</p>
      <div
        class="grid min-h-0 flex-1 gap-y-[2.5vmin] pt-[4vmin]"
        [style.grid-template-columns]="gridColumns()"
        [style.grid-template-rows]="
          'repeat(' + rows().length + ', minmax(0, 1fr)) auto'
        "
        [style.font-size.vmin]="fontSize()"
      >
        @for (row of rows(); track row.label; let r = $index) {
          @if (multi()) {
            <span
              class="self-end whitespace-nowrap pb-[0.6vmin] pr-[2.5vmin] font-bold text-gray-800"
              [style.grid-row]="r + 1"
              [style.grid-column]="1"
              >{{ row.label }}</span
            >
          }
          @for (col of row.columns; track $index; let i = $index) {
            <div
              class="flex min-h-0 flex-col items-center justify-end border-b-[0.3vmin] border-gray-300 px-[0.8vmin]"
              [style.grid-row]="r + 1"
              [style.grid-column]="i + offset() + 1"
            >
              @if (col.count > 0) {
                <span
                  class="fade-in mb-[0.8vmin] whitespace-nowrap font-bold leading-none text-gray-900"
                  [style.--i]="i + r * 3"
                  >{{ col.value }}</span
                >
              }
              <span
                class="grow-y block w-full max-w-[10vmin] rounded-t-[0.7vmin]"
                [style.--i]="i + r * 3"
                [style.height]="'calc((100% - 1.2em) * ' + col.share + ')'"
                [class.bg-accent-600]="col.peak"
                [class.bg-accent-400]="!col.peak"
              ></span>
            </div>
          }
        }
        @for (label of hourLabels(); track label; let i = $index) {
          <span
            class="whitespace-nowrap pt-[0.6vmin] text-center font-medium text-gray-700"
            [style.grid-row]="rows().length + 1"
            [style.grid-column]="i + offset() + 1"
            >{{ label }}</span
          >
        }
      </div>
    </div>
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeSlideComponent {
  readonly slide = input.required<Slide & { kind: 'time' }>();

  /** Several days: each row starts with its date. One day: the note names it. */
  protected multi = computed(() => this.slide().days.length > 1);
  protected offset = computed(() => (this.multi() ? 1 : 0));

  protected gridColumns = computed(() => {
    const columns = `repeat(${this.slide().hours.length}, minmax(0, 1fr))`;
    return this.multi() ? `max-content ${columns}` : columns;
  });

  protected rows = computed(() => {
    const { days, max } = this.slide();
    return days.map((day) => {
      const peak = Math.max(...day.counts);
      return {
        label: day.label,
        columns: day.counts.map((count) => ({
          count,
          value: formatCount(count),
          share: max > 0 ? count / max : 0,
          peak: count > 0 && count === peak,
        })),
      };
    });
  });

  /** A usual open day has up to eight hours; then every label says "Uhr", otherwise the note does. */
  protected hourLabels = computed(() => {
    const { hours } = this.slide();
    return hours.length <= 8 ? hours.map((h) => `${h} Uhr`) : hours;
  });

  protected note = computed(() => {
    const { dates, hours } = this.slide();
    return hours.length <= 8 ? `am ${dates}` : `am ${dates}, Uhrzeit`;
  });

  /** More hours or more days get smaller type, so labels never collide. */
  protected fontSize = computed(() => {
    const n = this.slide().hours.length;
    const base = n <= 8 ? 4 : n <= 12 ? 3.2 : 2.4;
    const days = this.rows().length;
    return days >= 3 ? base * 0.8 : days === 2 ? base * 0.9 : base;
  });
}
