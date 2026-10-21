import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { Product } from '@shared/models/types';
import { CatalogService } from '@core/services/catalog.service';
import { CartService } from '@core/services/cart.service';
import { CheckoutService } from '@core/services/checkout.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { TillTotalDialogComponent } from '@shared/components/till-total-dialog.component';
import { TillTotalService } from '@core/services/till-total.service';
import { euro } from '@shared/money';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { ProductTileComponent } from './product-tile.component';
import { LastSaleComponent } from './last-sale.component';

/**
 * The home screen: products on the left, the sale being put together on the
 * right. The till is meant for a tablet in landscape; below lg (portrait,
 * phones) the cart shrinks to a bar at the bottom.
 */
@Component({
  selector: 'app-till-page',
  imports: [
    ProductTileComponent,
    LastSaleComponent,
    ConfirmDialogComponent,
    TillTotalDialogComponent,
    FocusOnShowDirective,
  ],
  template: `
    <!-- Takes the focus back after paying or "Zurück", so the next sale starts on this screen -->
    <h1 class="sr-only" appFocusOnShow>Kassa</h1>
    <div class="flex min-h-0 flex-1">
      <main class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 short:p-3">
        <!-- Portrait tablets: the cart list only fits beside the products -->
        <p
          class="mb-4 hidden items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 text-base text-gray-700 lg:!hidden sm:portrait:flex"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path stroke-linecap="round" d="M7 3.5h4M17 20.5h-4" />
          </svg>
          Tablet quer halten: dann steht der Einkauf neben den Produkten.
        </p>

        @if (products().length > 0) {
          <ul
            class="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] sm:gap-4 short:gap-3"
            aria-label="Produkte"
          >
            @for (product of products(); track product.id) {
              <li><app-product-tile class="h-full" [product]="product" /></li>
            }
          </ul>
        } @else {
          <div class="mx-auto mt-16 max-w-md text-center">
            <p class="text-xl font-medium text-gray-800">
              Für dieses Buffet sind keine Produkte eingetragen.
            </p>
            <p class="mt-2 text-lg text-gray-600">
              Bitte der Lehrkraft am Buffet Bescheid geben: Produkte werden im
              alten TadeoT-Admin dem Buffet zugeordnet. Das Tablet lädt sie alle
              5 Minuten neu.
            </p>
          </div>
        }

        <!-- For counting the cash box at the end of a shift; kept out of the way -->
        <button
          type="button"
          class="mt-6 flex h-12 items-baseline gap-2 rounded-xl px-3 text-base text-gray-600 hover:bg-gray-200 short:mt-4"
          (click)="showTillTotal.set(true)"
        >
          Kassastand dieses Tablets
          <span class="font-bold tabular-nums text-gray-800">{{
            tillSum()
          }}</span>
        </button>
      </main>

      <!-- Cart panel, from lg -->
      <aside
        class="hidden w-96 shrink-0 flex-col bg-white shadow-xl lg:flex"
        aria-labelledby="cart-title"
      >
        <div class="flex items-baseline justify-between gap-4 px-6 pt-5">
          <h2 id="cart-title" class="text-2xl font-bold text-gray-900">
            Einkauf
          </h2>
          @if (!cart.empty()) {
            <span class="text-lg text-gray-600">{{ itemLabel() }}</span>
          }
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-3">
          @if (!cart.empty()) {
            <ul class="text-lg">
              @for (line of lines(); track line.id; let i = $index) {
                <li
                  class="flex items-center gap-3 border-b border-gray-100 py-1.5 last:border-0"
                >
                  <span
                    class="w-9 shrink-0 text-right font-bold tabular-nums text-gray-900"
                    >{{ line.amount }}×</span
                  >
                  <span
                    class="min-w-0 flex-1 hyphens-auto break-words text-gray-800"
                    lang="de"
                    >{{ line.name }}</span
                  >
                  <span
                    class="shrink-0 tabular-nums"
                    [class.text-gray-900]="!line.voucher"
                    [class.text-red-700]="line.voucher"
                    >{{ line.sum }}</span
                  >
                  <!-- Taking one out happens here, away from the tiles, so a tap on a tile only ever adds -->
                  <button
                    type="button"
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-100"
                    [attr.aria-label]="
                      line.voucher
                        ? line.name + ' herausnehmen'
                        : 'Einmal ' + line.name + ' weniger'
                    "
                    (click)="removeOne(line.product, i)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="3"
                      aria-hidden="true"
                    >
                      <path stroke-linecap="round" d="M5 12h14" />
                    </svg>
                  </button>
                </li>
              }
            </ul>
          } @else if (lastSale()) {
            <!-- Only the sale just done: the change is what the seller still needs -->
            <app-last-sale class="mt-2" [sale]="lastSale()!" />
          } @else {
            <p class="mt-2 text-lg text-gray-600">
              Noch nichts gewählt. Ein Produkt antippen, um es hinzuzufügen.
            </p>
          }
        </div>

        @if (!cart.empty()) {
          <div
            class="border-t border-gray-200 px-6 pb-6 pt-4 short:pb-4 short:pt-3"
          >
            <div class="flex items-baseline justify-between gap-4">
              <span class="text-xl text-gray-700">Summe</span>
              <span
                class="text-5xl font-bold tabular-nums tracking-tight text-gray-900 short:text-4xl"
                aria-live="polite"
                >{{ total() }}</span
              >
            </div>
            @if (cart.problem(); as problem) {
              <p
                id="pay-hint-side"
                class="mt-3 text-lg font-medium text-accent-800"
              >
                {{ problem }}
              </p>
            }
            <button
              type="button"
              class="btn-primary mt-4 h-20 w-full text-2xl sm:h-20 short:h-16"
              [attr.aria-disabled]="!cart.payable()"
              [attr.aria-describedby]="cart.problem() ? 'pay-hint-side' : null"
              (click)="checkout.pay()"
            >
              Kassieren
            </button>
            <button
              type="button"
              class="mt-3 h-12 w-full rounded-2xl text-lg font-medium text-gray-700 hover:bg-gray-100"
              (click)="askClear()"
            >
              Leeren
            </button>
          </div>
        }
      </aside>
    </div>

    <!-- Bottom bar, below lg -->
    <div
      class="flex min-h-20 flex-wrap items-center gap-x-4 gap-y-3 bg-white px-4 py-3 shadow-bar sm:flex-nowrap sm:px-6 lg:hidden"
    >
      @if (!cart.empty()) {
        <div class="min-w-0 flex-1">
          <p class="flex items-baseline gap-3">
            <span class="text-lg text-gray-700">Summe</span>
            <span
              class="whitespace-nowrap text-4xl font-bold tabular-nums tracking-tight text-gray-900"
              aria-live="polite"
              >{{ total() }}</span
            >
          </p>
          @if (cart.problem(); as problem) {
            <p id="pay-hint-bar" class="text-base font-medium text-accent-800">
              {{ problem }}
            </p>
          } @else {
            <p class="text-base text-gray-600">{{ itemLabel() }}</p>
          }
        </div>
        <!-- Own row on phones, so the sum never has to wrap -->
        <div class="flex w-full items-center gap-3 sm:w-auto">
          <button type="button" class="btn-secondary" (click)="askClear()">
            Leeren
          </button>
          <button
            type="button"
            class="btn-primary flex-1 px-8 sm:flex-none"
            [attr.aria-disabled]="!cart.payable()"
            [attr.aria-describedby]="cart.problem() ? 'pay-hint-bar' : null"
            (click)="checkout.pay()"
          >
            Kassieren
          </button>
        </div>
      } @else if (lastSale()) {
        <app-last-sale
          class="min-w-0 flex-1"
          [sale]="lastSale()!"
          [compact]="true"
        />
      } @else {
        <p class="text-lg text-gray-600">
          Ein Produkt antippen, um es hinzuzufügen.
        </p>
      }
    </div>

    @if (showTillTotal()) {
      <app-till-total-dialog (closed)="showTillTotal.set(false)" />
    }
    @if (confirmingClear()) {
      <app-confirm-dialog
        title="Einkauf leeren?"
        [text]="clearText()"
        keepLabel="Behalten"
        confirmLabel="Leeren"
        (keep)="confirmingClear.set(false)"
        (confirm)="clear()"
      />
    }
  `,
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TillPageComponent {
  private catalog = inject(CatalogService);
  protected cart = inject(CartService);
  protected checkout = inject(CheckoutService);

  private tillTotal = inject(TillTotalService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private injector = inject(Injector);

  protected confirmingClear = signal(false);
  protected showTillTotal = signal(false);
  protected tillSum = computed(() => euro(this.tillTotal.total().cents));
  protected products = computed(() => this.catalog.buffet()?.products ?? []);
  protected lastSale = this.checkout.lastSale;
  protected total = computed(() => euro(this.cart.total()));
  /** "3 Artikel"; a voucher is named, since it is not counted as an item. */
  protected itemLabel = computed(() => {
    const count = this.cart.itemCount();
    const items = count === 1 ? '1 Artikel' : `${count} Artikel`;
    return this.lines().some((l) => l.voucher) ? `${items} + Gutschein` : items;
  });
  protected clearText = computed(
    () =>
      `Alle Produkte (${this.itemLabel()}, ${this.total()}) werden aus dem Einkauf entfernt.`
  );
  protected lines = this.cart.receipt;

  /** A single item is quicker to take out again than to confirm. */
  protected askClear(): void {
    if (this.cart.lines().reduce((n, l) => n + l.amount, 0) > 1) {
      this.confirmingClear.set(true);
    } else {
      this.cart.clear();
    }
  }

  /**
   * Takes one out from the cart panel. When the line goes away with its button,
   * the focus moves to the next line's "−", or back to the till heading.
   */
  protected removeOne(product: Product, index: number): void {
    this.cart.remove(product);
    afterNextRender(
      () => {
        const host = this.host.nativeElement;
        if (host.contains(document.activeElement)) return;
        const buttons = host.querySelectorAll<HTMLElement>('aside li button');
        const next = buttons[Math.min(index, buttons.length - 1)];
        (next ?? host.querySelector<HTMLElement>('h1'))?.focus();
      },
      { injector: this.injector }
    );
  }

  protected clear(): void {
    this.cart.clear();
    this.confirmingClear.set(false);
  }
}
