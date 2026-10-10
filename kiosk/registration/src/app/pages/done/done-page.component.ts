import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { THANKS_SCREEN_MS } from '@shared/constants';

/**
 * After saving. With a photo, the licence number is the one thing the visitor
 * takes away, so it fills the screen and stays until the student moves on.
 * Without a photo, a short thank-you that returns to the start by itself.
 */
@Component({
  selector: 'app-done-page',
  imports: [FocusOnShowDirective],
  template: `
    @if (session.savedWithPhoto()) {
      <main
        class="flex h-full flex-col items-center justify-center gap-8 px-6 py-6 text-center short:gap-4"
      >
        <h1
          class="flex items-center gap-3 text-3xl font-bold text-gray-800 md:text-4xl"
          appFocusOnShow
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-9 w-9 shrink-0 text-accent-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Du bist angemeldet!
        </h1>

        <div class="flex flex-col items-center gap-x-14 gap-y-6 md:flex-row">
          @if (session.draft().photo; as src) {
            <img
              [src]="src"
              alt="Dein Foto"
              class="aspect-[3/4] h-[min(26dvh,20rem)] rounded-lg object-cover shadow-lg md:h-[min(46dvh,24rem)] short:h-[min(34dvh,14rem)]"
            />
          }
          <div class="md:text-left" role="status">
            <p class="text-xl font-medium text-gray-700 sm:text-2xl">
              Deine Nummer für den Roboterführerschein
            </p>
            <p
              class="mt-1 text-[clamp(6rem,22dvh,11rem)] font-bold tabular-nums leading-none tracking-tight text-gray-900"
            >
              {{ session.savedId() }}
            </p>
            <p class="mt-3 text-lg text-gray-600 sm:text-xl">
              Bitte merken oder mit dem Handy abfotografieren.
            </p>
          </div>
        </div>

        <button
          type="button"
          class="btn-primary px-10"
          (click)="session.reset()"
        >
          Nächste Anmeldung
        </button>
      </main>
    } @else {
      <main
        class="relative flex h-full flex-col items-center justify-center gap-6 px-6 text-center"
      >
        <span
          class="flex h-28 w-28 items-center justify-center rounded-full bg-accent-50"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 text-accent-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
        <h1
          class="text-4xl font-bold text-gray-800 md:text-5xl"
          role="status"
          appFocusOnShow
        >
          Du bist angemeldet!
        </h1>
        <p class="text-xl text-gray-600">Viel Spaß beim Tag der offenen Tür.</p>
        <!-- The whole screen is the button, so a tap anywhere starts over -->
        <button
          type="button"
          class="absolute inset-0 focus-visible:outline-offset-[-6px]"
          aria-label="Nächste Anmeldung starten"
          (click)="session.reset()"
        ></button>
      </main>
      <div
        class="fixed inset-x-0 bottom-0 h-1.5 bg-gray-200"
        aria-hidden="true"
      >
        <div
          class="countdown-bar"
          [style.animation-duration.ms]="duration"
        ></div>
      </div>
    }
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DonePageComponent {
  protected session = inject(RegistrationSessionService);
  protected duration = THANKS_SCREEN_MS;
}
