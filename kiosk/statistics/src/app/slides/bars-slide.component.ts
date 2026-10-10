import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { formatCount, formatPercent } from '@shared/format';
import { Slide } from '@shared/types';

/**
 * Horizontal bars, sorted, each labelled with its name and value. There is no
 * axis to read from the wall: the value stands at the tip of every bar.
 */
@Component({
  selector: 'app-bars-slide',
  template: `
    <div class="flex h-full flex-col">
      <h1 class="slide-title">{{ slide().title }}</h1>
      @if (slide().note; as note) {
        <p class="slide-note">{{ note }}</p>
      }
      <div class="flex min-h-0 flex-1 items-center pt-[4vmin]">
        <ol
          class="grid w-full gap-x-[2.5vmin]"
          [style.grid-template-columns]="'minmax(0, max-content) minmax(0, 1fr)'"
          [style.grid-template-rows]="
            'repeat(' + rows().length + ', minmax(0, 1fr))'
          "
          [style.height.vmin]="rows().length * rowMax()"
          [style.max-height.%]="100"
          [style.font-size.vmin]="fontSize()"
        >
          @for (row of rows(); track row.label; let i = $index) {
            <li class="contents">
              <span
                class="line-clamp-2 max-w-[34vw] self-center text-right font-medium leading-[1.1] text-gray-800 [hyphens:auto]"
                lang="de"
                >{{ row.label }}</span
              >
              <span class="flex min-w-0 items-center">
                <span
                  class="grow-x h-[58%] max-h-[7vmin] min-h-[1.2vmin] shrink-0 rounded-r-[0.7vmin]"
                  [style.--i]="i"
                  [style.width]="
                    'max(0.8vmin, calc((100% - ' +
                    reserve() +
                    'em) * ' +
                    row.share +
                    '))'
                  "
                  [style.background]="row.color"
                ></span>
                <span
                  class="fade-in ml-[1.4vmin] whitespace-nowrap font-bold text-gray-900"
                  [style.--i]="i"
                  >{{ row.value }}
                  @if (row.extra) {
                    <span class="font-medium text-gray-600">
                      {{ row.extra }}</span
                    >
                  }
                </span>
              </span>
            </li>
          }
        </ol>
      </div>
    </div>
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarsSlideComponent {
  readonly slide = input.required<Slide & { kind: 'bars' }>();

  protected rows = computed(() => {
    const { bars, unit, percentOf } = this.slide();
    const max = Math.max(...bars.map((b) => b.count));
    return bars.map((b) => ({
      label: b.label,
      share: b.count / max,
      color: b.color ?? 'var(--bar)',
      value: formatCount(b.count),
      extra: unit
        ? b.count === 1
          ? unit.one
          : unit.many
        : percentOf
          ? `· ${formatPercent(b.count, percentOf)}`
          : '',
    }));
  });

  /** Fewer bars get larger type; twelve still fit on one 16:9 slide. */
  protected fontSize = computed(() => {
    const n = this.rows().length;
    return n <= 6 ? 4.6 : n <= 9 ? 3.9 : 3.4;
  });

  /** Tallest row, so three bars do not turn into slabs. */
  protected rowMax = computed(() => this.fontSize() * 2.7);

  /** Room kept free at the end of the longest bar for its value, in em. */
  protected reserve = computed(() => {
    const { unit, percentOf } = this.slide();
    return unit ? 7.5 : percentOf ? 6.5 : 3.2;
  });
}
