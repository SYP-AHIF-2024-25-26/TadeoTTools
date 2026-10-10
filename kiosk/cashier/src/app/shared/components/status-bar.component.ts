import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CatalogService } from '@core/services/catalog.service';
import { CartService } from '@core/services/cart.service';
import { CheckoutService } from '@core/services/checkout.service';
import { OutboxService } from '@core/services/outbox.service';
import { NgOptimizedImage } from '@angular/common';
import { RejectedDialogComponent } from './rejected-dialog.component';

/**
 * For the student at the counter: which buffet, and whether sales are still
 * waiting to reach the server. The school logo closes the strip on the right.
 */
@Component({
  selector: 'app-status-bar',
  imports: [NgOptimizedImage, RejectedDialogComponent],
  template: `
    <div
      class="flex min-h-14 items-center gap-4 bg-gray-100 px-4 py-2 text-base text-gray-700 sm:px-6 short:min-h-12 short:py-1"
    >
      <!-- Wraps on narrow screens; the logo stays pinned on the right -->
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-1">
        @if (buffet(); as b) {
          <!-- Only the location: the legacy description is free text and often outdated -->
          <span class="whitespace-nowrap text-xl font-bold text-gray-900"
            >Buffet {{ b.location }}</span
          >
          @if (canSwitch()) {
            <button
              type="button"
              class="-my-1 h-10 rounded-xl px-3 font-medium text-gray-800 underline decoration-gray-400 underline-offset-4 hover:bg-gray-200"
              (click)="catalog.picking.set(true)"
            >
              Wechseln
            </button>
          }
        }

        <span class="ml-auto flex flex-wrap items-center gap-x-5 gap-y-1">
          <span role="status" class="contents">
            @if (waiting() > 0) {
              <span class="flex items-center gap-2 font-medium text-gray-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 3l18 18M8.5 16.5a5 5 0 017 0M5 13a10 10 0 015.2-2.8M12 20h.01M14.8 10.3A10 10 0 0119 13M1.5 9.5a15 15 0 014.2-2.8M10.6 5.1A15 15 0 0122.5 9.5"
                  />
                </svg>
                {{
                  waiting() === 1
                    ? '1 Verkauf wartet'
                    : waiting() + ' Verkäufe warten'
                }}
                auf Übertragung – Browserdaten nicht löschen
              </span>
            } @else if (catalogOffline()) {
              <span class="font-medium text-gray-900"
                >Offline – zuletzt geladene Produkte</span
              >
            }
            @if (rejected() > 0) {
              <span class="font-bold text-red-700">
                {{
                  rejected() === 1
                    ? '1 Verkauf nicht übertragbar'
                    : rejected() + ' Verkäufe nicht übertragbar'
                }}
              </span>
            }
          </span>
          @if (waiting() > 0) {
            <button
              type="button"
              class="-my-1 h-10 rounded-xl bg-white px-4 font-medium text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-60"
              [disabled]="sending()"
              (click)="outbox.flush()"
            >
              {{ sending() ? 'Sende …' : 'Jetzt senden' }}
            </button>
          }
          @if (rejected() > 0) {
            <button
              type="button"
              class="-my-1 h-10 rounded-xl bg-white px-4 font-medium text-red-700 shadow-sm hover:bg-red-50"
              (click)="showRejected.set(true)"
            >
              Ansehen
            </button>
          }
        </span>
      </div>
      <img
        ngSrc="assets/logo.png"
        width="1536"
        height="347"
        priority
        alt="HTL Leonding"
        class="h-8 w-auto shrink-0 short:h-7"
      />
    </div>

    @if (showRejected()) {
      <app-rejected-dialog (closed)="showRejected.set(false)" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  protected catalog = inject(CatalogService);
  protected outbox = inject(OutboxService);
  private cart = inject(CartService);
  private checkout = inject(CheckoutService);

  protected showRejected = signal(false);
  protected buffet = this.catalog.buffet;
  /** Only between two sales, and not while the choice is already open. */
  protected canSwitch = computed(
    () =>
      this.catalog.hasChoice() &&
      !this.catalog.picking() &&
      this.cart.empty() &&
      this.checkout.screen() === 'till'
  );
  /** Right after a sale it is being sent; only worth a word once that failed. */
  protected waiting = computed(() =>
    this.outbox.offline() ? this.outbox.waiting().length : 0
  );
  protected rejected = computed(() => this.outbox.rejected().length);
  protected sending = this.outbox.sending;
  protected catalogOffline = computed(
    () => this.catalog.ready() && this.catalog.failure() !== null
  );
}
