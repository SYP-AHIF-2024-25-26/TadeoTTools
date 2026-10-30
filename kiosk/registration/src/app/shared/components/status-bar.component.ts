import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { VisitorCountService } from '@core/services/visitor-count.service';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { AccessService } from '@core/services/access.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';

const numberFormat = new Intl.NumberFormat('de-AT');

/**
 * For the students at the entrance: how many visitors are registered so far,
 * who is logged in, and a warning when the server cannot be reached (saving
 * would fail).
 */
@Component({
  selector: 'app-status-bar',
  imports: [NgOptimizedImage, ConfirmDialogComponent],
  template: `
    <div
      class="flex min-h-11 items-center gap-4 bg-gray-100 px-4 py-2 text-base text-gray-700 sm:px-6 md:px-10 short:py-1"
    >
      <!-- Wraps on narrow screens; the logo stays pinned on the right -->
      <div
        class="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-1"
        role="status"
      >
        <span class="flex items-center gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-7 w-7 shrink-0 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M16 19v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 10a3 3 0 100-6 3 3 0 000 6zM21 19v-1a4 4 0 00-3-3.87M15.5 4.13a3 3 0 010 5.74"
            />
          </svg>
          @if (count(); as c) {
            <span class="flex flex-wrap items-baseline gap-x-5 gap-y-0.5">
              <span class="flex items-baseline gap-2">
                <span
                  class="text-4xl font-bold tabular-nums leading-none tracking-tight text-gray-900 short:text-3xl"
                  >{{ c.visitors }}</span
                >
                <span class="text-lg font-medium text-gray-800"
                  >angemeldet</span
                >
              </span>
              <span class="flex items-baseline gap-2">
                <span
                  class="text-2xl font-bold tabular-nums leading-none text-gray-700 short:text-xl"
                  >{{ c.withAdults }}</span
                >
                <span class="whitespace-nowrap text-lg text-gray-600"
                  >mit Begleitung</span
                >
              </span>
            </span>
          } @else {
            <span>Anmeldungen werden gezählt …</span>
          }
        </span>
        <span class="flex flex-wrap items-center gap-x-1">
          @if (userName()) {
            <span class="whitespace-nowrap">{{ userName() }}</span>
          }
          <!-- Only on the start screen: logging out reloads the page and would drop a registration -->
          @if (session.step() === 'start') {
            <button
              type="button"
              class="-my-1 h-11 rounded-xl px-3 font-medium text-gray-800 underline decoration-gray-400 underline-offset-4 hover:bg-gray-200"
              (click)="confirmingLogout.set(true)"
            >
              Ausloggen
            </button>
          }
        </span>
        @if (!reachable()) {
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
            Keine Verbindung zum Server – Anmelden geht gerade nicht
          </span>
        }
      </div>
      <!-- The start screen shows the large logo itself -->
      <img
        [class.hidden]="session.step() === 'start'"
        ngSrc="assets/logo.png"
        width="1536"
        height="347"
        priority
        alt="HTL Leonding"
        class="h-6 w-auto shrink-0 sm:h-8 short:h-7"
      />
    </div>
    <!-- Logging in again means typing the school password at the entrance -->
    @if (confirmingLogout()) {
      <app-confirm-dialog
        title="Ausloggen?"
        text="Danach loggt sich die nächste Person mit ihrem Schulkonto ein."
        keepLabel="Eingeloggt bleiben"
        confirmLabel="Ausloggen"
        (keep)="confirmingLogout.set(false)"
        (confirm)="access.logout()"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  private counter = inject(VisitorCountService);
  protected session = inject(RegistrationSessionService);
  protected access = inject(AccessService);

  protected confirmingLogout = signal(false);
  protected userName = this.access.userName;
  protected reachable = this.counter.reachable;
  protected count = computed(() => {
    const c = this.counter.count();
    return c
      ? {
          visitors: numberFormat.format(c.count),
          withAdults: numberFormat.format(c.count + c.adultsCount),
        }
      : null;
  });
}
