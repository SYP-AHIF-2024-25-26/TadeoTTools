import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CartService, isVoucher } from '@core/services/cart.service';
import { CheckoutService } from '@core/services/checkout.service';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { moveFocus } from '@shared/radio-keys';
import { euro } from '@shared/money';
import { MAX_EURO_DIGITS, QUICK_AMOUNTS } from '@shared/constants';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** 'exact' = "Passend"; a number = a quick amount in cents. */
type Quick = 'exact' | number;

/**
 * Taking the money: the receipt (items, sum, given, change) beside the input
 * for the amount handed over. The amount is optional; "Verkauf abschließen"
 * works without it when nothing needs to be worked out.
 */
@Component({
  selector: 'app-pay-page',
  imports: [FocusOnShowDirective],
  template: `
    <main
      class="mx-auto grid min-h-0 w-full max-w-6xl flex-1 content-start gap-x-10 gap-y-5 overflow-y-auto p-4 sm:p-6 md:grid-cols-2 lg:p-8 short:gap-y-3 short:p-3 short:md:p-4"
    >
      <!-- Receipt -->
      <section
        class="flex flex-col rounded-2xl bg-white p-5 shadow-lg sm:p-6 short:p-4"
        aria-labelledby="pay-title"
      >
        <h1
          id="pay-title"
          class="text-3xl font-bold text-gray-900 short:text-2xl"
          appFocusOnShow
        >
          Kassieren
        </h1>
        <ul class="mt-3 hidden text-lg md:block short:mt-2">
          @for (line of lines(); track line.id) {
            <li class="flex items-baseline gap-3 py-1">
              <span
                class="w-9 shrink-0 text-right font-bold tabular-nums text-gray-900"
                >{{ line.amount }}×</span
              >
              <span class="min-w-0 flex-1 break-words text-gray-800">{{
                line.name
              }}</span>
              <span
                class="shrink-0 tabular-nums"
                [class.text-gray-900]="!line.voucher"
                [class.text-red-700]="line.voucher"
                >{{ line.sum }}</span
              >
            </li>
          }
        </ul>
        <p class="mt-1 text-base text-gray-600 md:hidden">{{ summary() }}</p>

        <dl
          class="mt-4 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1 border-t border-gray-200 pt-4 short:mt-2 short:pt-2"
        >
          <dt class="text-xl text-gray-700">Summe</dt>
          <dd
            class="text-right text-4xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-5xl short:text-4xl"
          >
            {{ total() }}
          </dd>
          <dt class="text-xl text-gray-700">Gegeben</dt>
          <dd class="text-right text-2xl tabular-nums text-gray-900">
            {{ givenText() }}
          </dd>
        </dl>

        <div
          class="mt-4 rounded-xl px-4 py-3 short:mt-2 short:py-2"
          [class.bg-accent-50]="change() !== null"
          [class.bg-gray-50]="change() === null"
          role="status"
        >
          @if (change(); as c) {
            <p class="flex flex-wrap items-baseline justify-between gap-x-4">
              <span class="text-xl font-medium text-gray-800">Rückgeld</span>
              <span
                class="text-5xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-6xl short:text-5xl"
                >{{ c }}</span
              >
            </p>
          } @else if (missing()) {
            <p id="pay-hint" class="text-xl font-medium text-red-700">
              Es fehlen noch {{ missing() }}
            </p>
          } @else {
            <p class="text-lg text-gray-600">
              Betrag antippen oder eintippen, um das Rückgeld zu sehen – oder
              gleich abschließen.
            </p>
          }
        </div>
      </section>

      <!-- Amount handed over -->
      <section aria-labelledby="given-label">
        <h2 id="given-label" class="text-xl font-medium text-gray-800">
          Gegeben
        </h2>
        <div
          class="mt-3 grid gap-2 sm:gap-3 short:mt-2"
          [style.grid-template-columns]="quickColumns()"
          role="radiogroup"
          aria-labelledby="given-label"
        >
          @for (q of quickAmounts(); track q.value) {
            <button
              type="button"
              role="radio"
              class="chip min-w-0 px-1 text-lg sm:text-xl"
              [attr.aria-checked]="quick() === q.value"
              [attr.tabindex]="
                quick() === q.value || (quick() === null && $first) ? 0 : -1
              "
              (click)="pick(q.value)"
              (keydown)="moveFocus($event)"
            >
              {{ q.label }}
            </button>
          }
        </div>

        <div
          class="mt-4 grid max-w-sm grid-cols-3 gap-2 sm:gap-3 md:max-w-none short:mt-2"
          role="group"
          aria-label="Betrag eintippen"
        >
          @for (key of keys; track key) {
            <button type="button" class="key" (click)="type(key)">
              {{ key }}
            </button>
          }
          <button
            type="button"
            class="key"
            aria-label="Komma"
            [disabled]="typed().includes(',')"
            (click)="type(',')"
          >
            ,
          </button>
          <button type="button" class="key" (click)="type('0')">0</button>
          <button
            type="button"
            class="key"
            aria-label="Letzte Ziffer löschen"
            [disabled]="typed() === '' && quick() === null"
            (click)="erase()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 5H9l-6 7 6 7h12a1 1 0 001-1V6a1 1 0 00-1-1zM17 9l-5 6m0-6l5 6"
              />
            </svg>
          </button>
        </div>
      </section>
    </main>

    <footer
      class="flex items-center justify-between gap-4 bg-white px-4 py-3 shadow-[0_-4px_12px_-2px_rgb(0_0_0/0.08)] sm:px-6 short:py-2"
    >
      <button type="button" class="btn-secondary" (click)="checkout.back()">
        Zurück
      </button>
      <button
        type="button"
        class="btn-primary px-6 sm:px-10"
        [attr.aria-disabled]="missing() !== null"
        [attr.aria-describedby]="missing() !== null ? 'pay-hint' : null"
        [class.opacity-60]="missing() !== null"
        (click)="complete()"
      >
        Verkauf abschließen
      </button>
    </footer>
  `,
  host: {
    class: 'flex h-full flex-col',
    '(document:keydown)': 'onKey($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayPageComponent {
  private cart = inject(CartService);
  protected checkout = inject(CheckoutService);

  protected keys = KEYS;
  protected moveFocus = moveFocus;

  /** What was typed on the pad, in euros ("20", "12,5"). */
  protected typed = signal('');
  protected quick = signal<Quick | null>(null);

  protected total = computed(() => euro(this.cart.total()));
  protected lines = computed(() =>
    this.cart.lines().map((l) => ({
      id: l.product.id,
      amount: l.amount,
      name: l.product.name,
      sum: euro(l.amount * l.product.price),
      voucher: isVoucher(l.product),
    }))
  );
  protected summary = computed(() =>
    this.cart
      .lines()
      .map((l) => `${l.amount}× ${l.product.name}`)
      .join(', ')
  );
  /** "Passend" and the notes that cover the sum. */
  protected quickAmounts = computed(() => {
    const total = this.cart.total();
    return [
      { value: 'exact' as Quick, label: 'Passend' },
      ...QUICK_AMOUNTS.filter((a) => a > total).map((a) => ({
        value: a as Quick,
        label: euro(a).replace(',00', ''),
      })),
    ];
  });

  /** "Passend" is the longest word; the notes share the rest of the row. */
  protected quickColumns = computed(
    () =>
      `minmax(0, 1.6fr) repeat(${this.quickAmounts().length - 1}, minmax(0, 1fr))`
  );

  /** Cents handed over, or null when nothing was entered. */
  protected given = computed<number | null>(() => {
    const quick = this.quick();
    if (quick === 'exact') return this.cart.total();
    if (quick !== null) return quick;
    const typed = this.typed();
    if (typed === '' || typed === ',') return null;
    return Math.round(Number(typed.replace(',', '.')) * 100);
  });
  protected givenText = computed(() => {
    if (this.quick() === null && this.typed() !== '') {
      // As typed, so the student sees the comma they just entered.
      return `${this.typed()} €`;
    }
    const given = this.given();
    return given === null ? '–' : euro(given);
  });
  protected change = computed(() => {
    const given = this.given();
    return given !== null && given >= this.cart.total()
      ? euro(given - this.cart.total())
      : null;
  });
  protected missing = computed(() => {
    const given = this.given();
    return given !== null && given < this.cart.total()
      ? euro(this.cart.total() - given)
      : null;
  });

  protected pick(value: Quick): void {
    this.quick.set(value);
    this.typed.set('');
  }

  protected type(key: string): void {
    // Typing after a quick amount starts a new amount.
    const current = this.quick() === null ? this.typed() : '';
    this.quick.set(null);
    const [euros, cents] = current.split(',');
    if (key === ',') {
      if (current.includes(',')) return;
      this.typed.set((current || '0') + ',');
    } else if (cents !== undefined) {
      if (cents.length < 2) this.typed.set(current + key);
    } else if (euros === '0') {
      this.typed.set(key);
    } else if (euros.length < MAX_EURO_DIGITS) {
      this.typed.set(current + key);
    }
  }

  protected erase(): void {
    if (this.quick() !== null) {
      this.quick.set(null);
    } else {
      this.typed.set(this.typed().slice(0, -1));
    }
  }

  protected complete(): void {
    if (this.missing() !== null) return;
    this.checkout.complete(this.given());
  }

  /** A hardware keyboard works too: digits, comma, Backspace, Enter, Escape. */
  protected onKey(event: KeyboardEvent): void {
    if (document.querySelector('[aria-modal="true"]')) return;
    if (/^[0-9]$/.test(event.key)) this.type(event.key);
    else if (event.key === ',' || event.key === '.') this.type(',');
    else if (event.key === 'Backspace') this.erase();
    else if (event.key === 'Escape') this.checkout.back();
    else if (
      event.key === 'Enter' &&
      !(event.target instanceof HTMLButtonElement)
    )
      this.complete();
    else return;
    event.preventDefault();
  }
}
