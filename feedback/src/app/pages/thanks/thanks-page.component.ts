import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeedbackSessionService } from '@core/services/feedback-session.service';
import { THANKS_SCREEN_MS } from '@shared/constants';

/** Shown to the visitor after sending; returns to the start screen by itself. */
@Component({
  selector: 'app-thanks-page',
  template: `
    <button
      type="button"
      class="flex h-full w-full flex-col items-center justify-center gap-6 px-6 text-center"
      aria-label="Neues Feedback vorbereiten"
      (click)="session.reset()"
    >
      <span
        class="flex h-28 w-28 items-center justify-center rounded-full bg-green-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
      <span class="text-4xl font-bold text-gray-800 md:text-5xl" role="status">
        Danke für dein Feedback!
      </span>
      <span class="text-xl text-gray-600">
        Wir freuen uns, dich bald wiederzusehen.
      </span>
    </button>
    <div class="fixed inset-x-0 bottom-0 h-1.5 bg-gray-200" aria-hidden="true">
      <div
        class="thanks-countdown h-full origin-left bg-orange-500"
        [style.animation-duration.ms]="duration"
      ></div>
    </div>
  `,
  styles: `
    .thanks-countdown {
      animation-name: shrink;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }
    @keyframes shrink {
      to {
        transform: scaleX(0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .thanks-countdown {
        animation: none;
      }
    }
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThanksPageComponent {
  protected session = inject(FeedbackSessionService);
  protected duration = THANKS_SCREEN_MS;
}
