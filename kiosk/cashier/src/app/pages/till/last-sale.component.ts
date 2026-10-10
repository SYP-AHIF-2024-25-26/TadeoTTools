import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { LastSale } from '@shared/models/types';
import { euro } from '@shared/money';

/**
 * The sale just completed. It stays on the till until the next product is
 * tapped, so the change can still be read while counting coins.
 */
@Component({
  selector: 'app-last-sale',
  template: `
    <p class="flex items-center gap-2 text-lg font-medium text-gray-800">
      <span
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
      Verkauf gespeichert
    </p>
    @if (change(); as c) {
      <p
        class="text-gray-700"
        [class.mt-4]="!compact()"
        [class.mt-1]="compact()"
      >
        Summe {{ total() }} · gegeben {{ c.given }}
      </p>
      <p
        class="flex items-baseline gap-3"
        [class.mt-1]="!compact()"
        [class.flex-wrap]="!compact()"
      >
        <span class="text-lg text-gray-700">Rückgeld</span>
        <span
          class="font-bold tabular-nums tracking-tight text-gray-900"
          [class.text-5xl]="!compact()"
          [class.text-3xl]="compact()"
          >{{ c.change }}</span
        >
      </p>
    } @else {
      <p class="text-gray-700" [class.mt-2]="!compact()">Summe {{ total() }}</p>
    }
  `,
  host: { class: 'block', role: 'status' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LastSaleComponent {
  readonly sale = input.required<LastSale>();
  /** One or two lines for the bottom bar on phones and portrait tablets. */
  readonly compact = input(false);

  protected total = computed(() => euro(this.sale().total));
  protected change = computed(() => {
    const { given, total } = this.sale();
    return given === null
      ? null
      : { given: euro(given), change: euro(given - total) };
  });
}
