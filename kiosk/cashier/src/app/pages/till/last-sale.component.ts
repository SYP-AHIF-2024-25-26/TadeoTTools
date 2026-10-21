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
 * tapped, so the change can still be read while counting coins: the change is
 * the loudest thing on the screen, in the same box as on the pay screen.
 */
@Component({
  selector: 'app-last-sale',
  template: `
    <p
      class="flex flex-wrap items-center gap-x-2 font-medium text-gray-800"
      [class.text-lg]="!compact()"
      [class.text-base]="compact()"
    >
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
      @if (compact()) {
        <!-- Beside the heading where it fits; on phones a line of its own, without a leading dot -->
        <span class="w-full font-normal text-gray-600 sm:w-auto"
          ><span class="hidden sm:inline" aria-hidden="true">· </span
          >{{ detail() }}</span
        >
      }
    </p>

    @switch (paid().kind) {
      @case ('change') {
        <div
          class="flex flex-wrap items-center justify-between gap-x-4 rounded-xl bg-accent-50"
          [class.mt-4]="!compact()"
          [class.px-4]="!compact()"
          [class.py-3]="!compact()"
          [class.mt-1]="compact()"
          [class.px-3]="compact()"
          [class.py-1]="compact()"
        >
          <span class="text-xl font-medium text-gray-800">Rückgeld</span>
          <span
            class="font-bold tabular-nums tracking-tight text-gray-900"
            [class.text-6xl]="!compact()"
            [class.text-4xl]="compact()"
            >{{ paid().change }}</span
          >
        </div>
      }
      @case ('exact') {
        <p
          class="font-bold text-gray-900"
          [class.mt-4]="!compact()"
          [class.text-4xl]="!compact()"
          [class.mt-1]="compact()"
          [class.text-3xl]="compact()"
        >
          Passend bezahlt
        </p>
      }
      @default {
        <p
          class="flex flex-wrap items-baseline gap-x-3"
          [class.mt-4]="!compact()"
          [class.mt-1]="compact()"
        >
          <span class="text-xl text-gray-700">Summe</span>
          <span
            class="font-bold tabular-nums tracking-tight text-gray-900"
            [class.text-5xl]="!compact()"
            [class.text-3xl]="compact()"
            >{{ total() }}</span
          >
        </p>
      }
    }

    @if (!compact()) {
      <p class="mt-3 text-lg text-gray-700">{{ summary() }}</p>
      <!-- Only needed when a sale has to be traced later (refused, or sold twice) -->
      <p class="mt-1 text-base text-gray-600">Nr. {{ sale().orderNumber }}</p>
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
  /** Change to hand out, paid exactly, or no amount entered. */
  protected paid = computed(() => {
    const { given, total } = this.sale();
    if (given === null) return { kind: 'none' as const, change: '' };
    if (given === total) return { kind: 'exact' as const, change: '' };
    return { kind: 'change' as const, change: euro(given - total) };
  });
  protected summary = computed(() => {
    const given = this.sale().given;
    if (given === null) return 'Ohne gegebenen Betrag abgeschlossen';
    return given === this.sale().total
      ? `Summe ${this.total()}`
      : `Summe ${this.total()} · gegeben ${euro(given)}`;
  });
  /** The bottom bar's one line of context. */
  protected detail = computed(() =>
    this.paid().kind === 'none'
      ? `Nr. ${this.sale().orderNumber}`
      : this.summary()
  );
}
