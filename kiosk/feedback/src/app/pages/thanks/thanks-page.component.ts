import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeedbackSessionService } from '@core/services/feedback-session.service';
import { DivisionService } from '@core/services/division.service';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { THANKS_SCREEN_MS } from '@shared/constants';

/** Shown to the visitor after sending; returns to the start screen by itself. */
@Component({
  selector: 'app-thanks-page',
  imports: [FocusOnShowDirective],
  template: `
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
        Danke für dein Feedback!
      </h1>
      <p class="text-xl text-gray-600">
        Wir freuen uns, dich bald wiederzusehen.
      </p>
      <!-- The school's divisions, in the colours set in the dashboard -->
      @if (colors.length > 0) {
        <div
          class="mt-4 flex h-2 w-56 overflow-hidden rounded-full"
          aria-hidden="true"
        >
          @for (color of colors; track $index) {
            <span class="flex-1" [style.background-color]="color"></span>
          }
        </div>
      }
      <!-- The whole screen is the button, so a tap anywhere starts over -->
      <button
        type="button"
        class="absolute inset-0 focus-visible:outline-offset-[-6px]"
        aria-label="Nächstes Feedback starten"
        (click)="session.reset()"
      ></button>
    </main>
    <div class="fixed inset-x-0 bottom-0 h-1.5 bg-gray-200" aria-hidden="true">
      <div class="countdown-bar" [style.animation-duration.ms]="duration"></div>
    </div>
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThanksPageComponent {
  protected session = inject(FeedbackSessionService);
  protected colors = inject(DivisionService).schoolColors();
  protected duration = THANKS_SCREEN_MS;
}
