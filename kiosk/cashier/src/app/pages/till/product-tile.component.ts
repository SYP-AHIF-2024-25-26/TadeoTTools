import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { CartService, isVoucher } from '@core/services/cart.service';
import { CheckoutService } from '@core/services/checkout.service';
import { Product } from '@shared/models/types';
import { euro } from '@shared/money';

/**
 * One product on the till. A tap anywhere adds one; "−" sits apart in the
 * corner, so a hurried tap can only ever add. A voucher is a toggle instead
 * (one per sale).
 */
@Component({
  selector: 'app-product-tile',
  template: `
    <button
      type="button"
      class="tile h-full w-full p-3 sm:p-4 short:p-3"
      [attr.data-selected]="amount() > 0 ? '' : null"
      [attr.data-voucher]="voucher() ? '' : null"
      [attr.aria-pressed]="voucher() ? amount() > 0 : null"
      (click)="add()"
    >
      <!-- A break opportunity after "/" ("Wurst-/Käsesemmel") before any mid-word break -->
      <span
        class="line-clamp-3 hyphens-auto break-words pr-4 text-base font-medium leading-snug text-gray-900 sm:text-lg"
        lang="de"
        >{{ displayName() }}</span
      >
      @if (product().measure) {
        <span class="mt-0.5 text-base text-gray-600">{{
          product().measure
        }}</span>
      }
      <span
        class="mt-auto pt-2 text-xl font-bold tabular-nums sm:text-2xl"
        [class.text-gray-900]="!voucher()"
        [class.text-red-700]="voucher()"
        >{{ price() }}</span
      >
      @if (voucher()) {
        <span class="text-sm text-gray-600">max. 1 pro Einkauf</span>
      }
      @if (!voucher() && amount() > 0) {
        <span class="sr-only">, {{ amount() }} im Einkauf</span>
      }

      <!-- How many are in the cart (a check for a voucher), pinned to the corner so the name keeps its width -->
      @if (amount() > 0) {
        <span
          class="absolute -right-2.5 -top-2.5 flex h-10 min-w-10 items-center justify-center rounded-full bg-accent-600 px-2 text-xl font-bold tabular-nums text-white shadow-md ring-[3px] ring-canvas"
          aria-hidden="true"
        >
          @if (voucher()) {
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          } @else {
            {{ amount() }}
          }
        </span>
      }
    </button>

    @if (!voucher() && amount() > 0) {
      <button
        type="button"
        class="absolute bottom-2 right-2 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-accent-600 bg-white text-accent-700 shadow-sm hover:bg-accent-100 short:h-12 short:w-12"
        [attr.aria-label]="'Einmal ' + name() + ' weniger'"
        (click)="cart.remove(product())"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="3"
          aria-hidden="true"
        >
          <path stroke-linecap="round" d="M5 12h14" />
        </svg>
      </button>
    }
  `,
  host: { class: 'relative block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTileComponent {
  readonly product = input.required<Product>();

  protected cart = inject(CartService);
  private checkout = inject(CheckoutService);

  protected name = computed(() => this.product().name);
  /** A zero-width space after each "/" lets the line break there. */
  protected displayName = computed(() => this.name().replaceAll('/', '/​'));
  protected voucher = computed(() => isVoucher(this.product()));
  protected price = computed(() => euro(this.product().price));
  protected amount = computed(() => this.cart.amount(this.product()));

  protected add(): void {
    // The next sale has started: the last one's change is no longer needed.
    this.checkout.lastSale.set(null);
    this.cart.add(this.product());
  }
}
