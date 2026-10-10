import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { formatCount, formatPercent } from '@shared/format';
import { Slide } from '@shared/types';

/**
 * One bar split into its parts, with the figures above the ends they belong
 * to. A swatch beside each name carries the identity, never the text colour.
 */
@Component({
  selector: 'app-gender-slide',
  template: `
    <div class="flex h-full flex-col">
      <h1 class="slide-title">Angemeldet nach Geschlecht</h1>
      <div class="flex min-h-0 flex-1 flex-col justify-center pb-[4vmin]">
        <div class="flex justify-between gap-[6vmin]">
          @for (
            part of parts();
            track part.label;
            let i = $index;
            let last = $last
          ) {
            <div
              class="fade-in flex flex-col"
              [class.items-end]="last && parts().length > 1"
              [class.text-right]="last && parts().length > 1"
              [style.--i]="i"
            >
              <span
                class="flex items-center gap-[1.4vmin] font-medium text-gray-800"
                [style.font-size.vmin]="5"
              >
                <span
                  class="inline-block h-[3.2vmin] w-[3.2vmin] shrink-0 rounded-[0.6vmin]"
                  [style.background]="part.color"
                  aria-hidden="true"
                ></span>
                {{ part.label }}
              </span>
              <span
                class="font-bold leading-none tracking-[-0.03em] text-gray-900"
                [style.font-size.vmin]="17"
                >{{ part.value }}</span
              >
              <span
                class="mt-[1vmin] text-gray-600"
                [style.font-size.vmin]="5"
                >{{ part.percent }}</span
              >
            </div>
          }
        </div>
        <div class="mt-[5vmin] flex h-[9vmin] gap-[0.5vmin]">
          @for (part of parts(); track part.label; let i = $index) {
            <span
              class="grow-x block min-w-[0.8vmin] first:rounded-l-[0.9vmin] last:rounded-r-[0.9vmin]"
              [style.--i]="i"
              [style.flex-grow]="part.count"
              [style.flex-basis]="0"
              [style.background]="part.color"
            ></span>
          }
        </div>
      </div>
    </div>
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenderSlideComponent {
  readonly slide = input.required<Slide & { kind: 'gender' }>();

  protected parts = computed(() => {
    const { parts, total } = this.slide();
    return parts.map((p) => ({
      label: p.label,
      count: p.count,
      color: p.color,
      value: formatCount(p.count),
      percent: formatPercent(p.count, total),
    }));
  });
}
