import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { AccessService } from '@core/services/access.service';

/**
 * Before the till: start page with the login button, the school login is being
 * checked, or the logged-in person may not sell (then they log out again).
 * Keycloak's form only appears after "Anmelden" is pressed.
 */
@Component({
  selector: 'app-access-page',
  imports: [NgOptimizedImage, FocusOnShowDirective],
  template: `
    <main
      class="flex flex-1 flex-col items-center justify-center gap-10 overflow-y-auto px-6 py-8 text-center short:gap-6"
    >
      <img
        ngSrc="assets/logo.png"
        width="1536"
        height="347"
        priority
        alt="HTL Leonding"
        class="h-auto w-[min(60vw,24rem)]"
      />
      <h1
        class="text-balance text-4xl font-bold text-gray-800 md:text-5xl"
        appFocusOnShow
      >
        Buffet-Kassa
      </h1>

      @switch (state()) {
        @case ('checking') {
          <p
            class="flex h-20 items-center gap-3 text-xl text-gray-600"
            role="status"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-7 w-7 motion-safe:animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                stroke-width="3"
                class="opacity-25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
            Anmeldung wird geprüft …
          </p>
        }
        @case ('logged-out') {
          <div class="max-w-lg">
            <p class="text-lg text-gray-600">
              Zum Kassieren mit dem Schulkonto anmelden.
            </p>
            <button
              type="button"
              class="btn-primary mx-auto mt-8 px-12"
              (click)="access.login()"
            >
              Anmelden
            </button>
          </div>
        }
        @case ('denied') {
          <div class="max-w-lg" role="alert">
            <p class="text-xl font-medium text-gray-800">
              Kein Zugang zur Kassa
              @if (userName()) {
                für {{ userName() }}
              }
            </p>
            <p class="mt-2 text-lg text-gray-600">
              Kassieren dürfen Lehrer:innen und Schüler:innen, die der Station
              „Buffet“ zugeteilt sind. Fehlt die Zuteilung, bitte der Lehrkraft
              am Buffet Bescheid geben.
            </p>
            <button
              type="button"
              class="btn-primary mx-auto mt-8 px-10"
              (click)="access.logout()"
            >
              Abmelden
            </button>
          </div>
        }
        @default {
          <div class="max-w-lg" role="alert">
            <p class="text-xl font-medium text-gray-800">
              Die Anmeldung konnte nicht geprüft werden.
            </p>
            <p class="mt-2 text-lg text-gray-600">
              @if (state() === 'no-network') {
                Keine Verbindung zum Server. Bitte das WLAN des Tablets prüfen.
              } @else {
                Der Server meldet einen Fehler. Bitte kurz warten und erneut
                versuchen.
              }
            </p>
            <button
              type="button"
              class="btn-primary mx-auto mt-8 px-10"
              (click)="access.check()"
            >
              Erneut versuchen
            </button>
          </div>
        }
      }
    </main>
  `,
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessPageComponent {
  protected access = inject(AccessService);
  protected state = this.access.state;
  protected userName = this.access.userName;
}
