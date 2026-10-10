import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { ReferenceDataService } from '@core/services/reference-data.service';

const timeFormat = new Intl.DateTimeFormat('de-AT', {
  hour: '2-digit',
  minute: '2-digit',
});

@Component({
  selector: 'app-start-page',
  imports: [NgOptimizedImage, FocusOnShowDirective],
  template: `
    <main
      class="flex flex-1 flex-col items-center justify-center gap-12 px-6 text-center short:gap-8"
    >
      <img
        ngSrc="assets/logo.png"
        width="1536"
        height="347"
        priority
        alt="HTL Leonding"
        class="h-auto w-[min(70vw,32rem)]"
      />

      <div>
        <h1
          class="text-balance text-4xl font-bold text-gray-800 md:text-5xl"
          appFocusOnShow
        >
          Willkommen zum Tag der offenen Tür
        </h1>
        <p class="mt-4 text-xl text-gray-600">
          Bevor es losgeht: ein paar kurze Fragen zur Anmeldung.
        </p>
      </div>

      @if (ready()) {
        <button
          type="button"
          class="flex h-20 items-center gap-3 whitespace-nowrap rounded-2xl bg-accent-600 px-8 text-2xl font-bold text-white shadow-md hover:bg-accent-700 active:scale-[0.98] sm:px-12"
          (click)="session.start()"
        >
          Anmeldung starten
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      } @else if (failure() === null) {
        <!-- First start: nothing cached yet and the first request is still running -->
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
          Orte und Auswahllisten werden geladen …
        </p>
      } @else {
        <div class="max-w-lg" role="alert">
          <p class="text-xl font-medium text-gray-800">
            Orte und Auswahllisten konnten nicht geladen werden.
          </p>
          <p class="mt-2 text-lg text-gray-600">
            @if (failure() === 'no-network') {
              Keine Verbindung zum Server. Bitte das WLAN des Tablets prüfen.
            } @else {
              Der Server meldet einen Fehler. Bitte kurz warten und erneut
              versuchen.
            }
          </p>
          <button
            type="button"
            class="btn-primary mx-auto mt-8 px-10"
            [disabled]="loading()"
            (click)="reference.load()"
          >
            {{ loading() ? 'Verbinde …' : 'Erneut versuchen' }}
          </button>
          @if (lastAttempt(); as at) {
            <p class="mt-4 text-base text-gray-600">
              Zuletzt versucht um {{ at }} Uhr. Das Tablet versucht es alle 30
              Sekunden von selbst.
            </p>
          }
        </div>
      }
    </main>
  `,
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartPageComponent {
  protected session = inject(RegistrationSessionService);
  protected reference = inject(ReferenceDataService);

  protected ready = this.reference.ready;
  protected loading = this.reference.loading;
  protected failure = this.reference.failure;
  protected lastAttempt = computed(() => {
    const at = this.reference.lastAttempt();
    return at ? timeFormat.format(at) : null;
  });
}
