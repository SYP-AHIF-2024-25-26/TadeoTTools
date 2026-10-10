import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CatalogService } from '@core/services/catalog.service';
import { CartService, isVoucher } from '@core/services/cart.service';
import { CheckoutService } from '@core/services/checkout.service';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog.component';
import { TillTotalDialogComponent } from '@shared/components/till-total-dialog.component';
import { TillTotalService } from '@core/services/till-total.service';
import { euro } from '@shared/money';
import { ProductTileComponent } from './product-tile.component';
import { LastSaleComponent } from './last-sale.component';

/**
 * The home screen: products on the left (top on narrow screens), the sale
 * being put together on the right (a bar at the bottom on narrow screens).
 */
@Component({
  selector: 'app-till-page',
  imports: [
    ProductTileComponent,
    LastSaleComponent,
    ConfirmDialogComponent,
    TillTotalDialogComponent,
  ],
  template: `
    <h1 class="sr-only">Kassa</h1>
    <div class="flex min-h-0 flex-1">
      <main class="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 short:p-3">
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
              Produkte werden im alten TadeoT-Admin dem Buffet zugeordnet. Das
              Tablet lädt sie alle 5 Minuten neu.
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
        class="hidden w-[22rem] shrink-0 flex-col bg-white shadow-xl lg:flex"
        aria-labelledby="cart-title"
      >
        <div class="flex items-baseline justify-between gap-4 px-6 pt-5">
          <h2 id="cart-title" class="text-2xl font-bold text-gray-900">
            Einkauf
          </h2>
          @if (itemCount() > 0) {
            <span class="text-lg text-gray-600">{{ itemLabel() }}</span>
          }
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-3">
          @if (!cart.empty()) {
            <ul class="text-lg">
              @for (line of lines(); track line.id) {
                <li
                  class="flex items-baseline gap-3 border-b border-gray-100 py-2.5 last:border-0"
                >
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
          } @else if (lastSale()) {
            <app-last-sale class="mt-2" [sale]="lastSale()!" />
          } @else {
            <p class="mt-2 text-lg text-gray-600">
              Noch nichts gewählt. Ein Produkt antippen, um es hinzuzufügen.
            </p>
          }
        </div>

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
            [class.opacity-60]="!cart.payable()"
            (click)="checkout.pay()"
          >
            Kassieren
          </button>
          <button
            type="button"
            class="mt-3 h-12 w-full rounded-2xl text-lg font-medium text-gray-700 hover:bg-gray-100 disabled:invisible"
            [disabled]="cart.empty()"
            (click)="askClear()"
          >
            Leeren
          </button>
        </div>
      </aside>
    </div>

    <!-- Bottom bar, below lg -->
    <div
      class="flex flex-wrap items-center gap-x-4 gap-y-3 bg-white px-4 py-3 shadow-[0_-4px_12px_-2px_rgb(0_0_0/0.08)] sm:flex-nowrap sm:px-6 lg:hidden"
    >
      @if (cart.empty() && lastSale(); as sale) {
        <app-last-sale class="min-w-0 flex-1" [sale]="sale" [compact]="true" />
      } @else {
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
          } @else if (itemCount() > 0) {
            <p class="text-base text-gray-600">{{ itemLabel() }}</p>
          }
        </div>
      }
      <!-- Own row on phones, so the sum never has to wrap -->
      <div class="flex w-full items-center gap-3 sm:w-auto">
        @if (!cart.empty()) {
          <button type="button" class="btn-secondary" (click)="askClear()">
            Leeren
          </button>
        }
        <button
          type="button"
          class="btn-primary flex-1 px-8 sm:flex-none"
          [attr.aria-disabled]="!cart.payable()"
          [attr.aria-describedby]="cart.problem() ? 'pay-hint-bar' : null"
          [class.opacity-60]="!cart.payable()"
          (click)="checkout.pay()"
        >
          Kassieren
        </button>
      </div>
    </div>

    @if (showTillTotal()) {
      <app-till-total-dialog (closed)="showTillTotal.set(false)" />
    }
    @if (confirmingClear()) {
      <app-confirm-dialog
        title="Einkauf leeren?"
        text="Alle gewählten Produkte werden aus dem Einkauf entfernt."
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

  protected confirmingClear = signal(false);
  protected showTillTotal = signal(false);
  protected tillSum = computed(() => euro(this.tillTotal.total().cents));
  protected products = computed(() => this.catalog.buffet()?.products ?? []);
  protected lastSale = this.checkout.lastSale;
  protected total = computed(() => euro(this.cart.total()));
  protected itemCount = this.cart.itemCount;
  protected itemLabel = computed(() =>
    this.itemCount() === 1 ? '1 Artikel' : `${this.itemCount()} Artikel`
  );
  protected lines = computed(() =>
    this.cart.lines().map((l) => ({
      id: l.product.id,
      amount: l.amount,
      name: l.product.name,
      sum: euro(l.amount * l.product.price),
      voucher: isVoucher(l.product),
    }))
  );

  /** A single item is quicker to take out again than to confirm. */
  protected askClear(): void {
    if (this.cart.lines().reduce((n, l) => n + l.amount, 0) > 1) {
      this.confirmingClear.set(true);
    } else {
      this.cart.clear();
    }
  }

  protected clear(): void {
    this.cart.clear();
    this.confirmingClear.set(false);
  }
}
