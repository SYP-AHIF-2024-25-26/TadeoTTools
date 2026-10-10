import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { CatalogService } from '@core/services/catalog.service';
import { CartService } from '@core/services/cart.service';
import { CheckoutService } from '@core/services/checkout.service';
import { OutboxService } from '@core/services/outbox.service';
import { WakeLockService } from '@core/services/wake-lock.service';
import { StartPageComponent } from '@pages/start/start-page.component';
import { TillPageComponent } from '@pages/till/till-page.component';
import { PayPageComponent } from '@pages/pay/pay-page.component';
import { StatusBarComponent } from '@shared/components/status-bar.component';

/**
 * The kiosk has no routes: the till is the home screen, and a reload or the
 * browser's back button cannot jump into the middle of a sale.
 */
@Component({
  selector: 'app-root',
  imports: [
    StartPageComponent,
    TillPageComponent,
    PayPageComponent,
    StatusBarComponent,
  ],
  template: `
    @if (selling()) {
      <app-status-bar />
    }
    <div class="min-h-0 flex-1">
      @if (!selling()) {
        <app-start-page />
      } @else if (checkout.screen() === 'pay') {
        <app-pay-page />
      } @else {
        <app-till-page />
      }
    </div>
  `,
  host: { class: 'flex h-dvh flex-col select-none text-gray-800' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private catalog = inject(CatalogService);
  private cart = inject(CartService);
  private outbox = inject(OutboxService);
  protected checkout = inject(CheckoutService);
  private swUpdate = inject(SwUpdate);
  private updateReady = signal(false);

  /** A buffet is known and the student is not switching to another one. */
  protected selling = computed(
    () => this.catalog.buffet() !== null && !this.catalog.picking()
  );

  constructor() {
    inject(WakeLockService).keepAwake();
    this.catalog.load();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') this.updateReady.set(true);
      });
    }

    // A new version is only applied between two sales: not mid-sale, not while the
    // change is still shown, not while sending.
    effect(() => {
      if (
        this.updateReady() &&
        this.checkout.screen() === 'till' &&
        this.cart.empty() &&
        this.checkout.lastSale() === null &&
        !this.outbox.sending()
      ) {
        document.location.reload();
      }
    });
  }
}
