import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { formatCount } from '@shared/format';
import { Slide } from '@shared/types';

/** Registrations per hour of the latest day; the busiest hour is the darkest column. */
@Component({
  selector: 'app-time-slide',
  template: `
    <div class="flex h-full flex-col">
      <h1 class="slide-title">Anmeldungen pro Stunde</h1>
      <p class="slide-note">{{ note() }}</p>
      <div
        class="grid min-h-0 flex-1 pt-[4vmin]"
        [style.grid-template-columns]="
          'repeat(' + columns().length + ', minmax(0, 1fr))'
        "
        [style.grid-template-rows]="'minmax(0, 1fr) auto'"
        [style.font-size.vmin]="fontSize()"
      >
        @for (col of columns(); track col.label; let i = $index) {
          <div
            [style.grid-row]="1"
            class="flex min-h-0 flex-col items-center justify-end border-b-[0.3vmin] border-gray-300 px-[0.8vmin]"
          >
            @if (col.count > 0) {
              <span
                class="fade-in mb-[1vmin] whitespace-nowrap font-bold text-gray-900"
                [style.--i]="i"
                >{{ col.value }}</span
              >
            }
            <span
              class="grow-y block w-full max-w-[10vmin] rounded-t-[0.7vmin]"
              [style.--i]="i"
              [style.height]="'calc((100% - 1.4em) * ' + col.share + ')'"
              [class.bg-accent-600]="col.peak"
              [class.bg-accent-400]="!col.peak"
            ></span>
          </div>
          <span
            class="whitespace-nowrap pt-[1.2vmin] text-center font-medium text-gray-700"
            [style.grid-row]="2"
            [style.grid-column]="i + 1"
            >{{ col.label }}</span
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

  protected columns = computed(() => {
    const { hours, peak } = this.slide();
    return hours.map((h) => ({
      label: hours.length <= 8 ? `${h.label} Uhr` : h.label,
      count: h.count,
      value: formatCount(h.count),
      share: peak > 0 ? h.count / peak : 0,
      peak: h.count === peak,
    }));
  });

  /** A usual open day has up to eight hours; then every label says "Uhr", otherwise the note does. */
  protected note = computed(() => {
    const { date, hours } = this.slide();
    return hours.length <= 8 ? `am ${date}` : `am ${date}, Uhrzeit`;
  });

  /** A long day (many hours) gets smaller labels so "13–14" never collides. */
  protected fontSize = computed(() => {
    const n = this.columns().length;
    return n <= 8 ? 4 : n <= 12 ? 3.2 : 2.4;
  });
}
