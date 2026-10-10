import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  untracked,
} from '@angular/core';
import { FeedbackSessionService } from '@core/services/feedback-session.service';
import { IDLE_COUNTDOWN_S, IDLE_WARNING_MS } from '@shared/constants';
import { DialogComponent } from './dialog.component';

/**
 * A visitor who walks away mid-feedback must not leave their answers on screen
 * for the next one. After a while without input this asks "Noch da?" and, if
 * nobody answers, discards the feedback. It never resets without that warning.
 */
@Component({
  selector: 'app-idle-guard',
  imports: [DialogComponent],
  template: `
    @if (remaining() !== null) {
      <app-dialog
        labelledBy="idle-title"
        describedBy="idle-text"
        (dismiss)="keep()"
      >
        <h2 id="idle-title" class="text-3xl font-bold">Noch da?</h2>
        <p id="idle-text" class="mt-3 text-xl text-gray-600">
          Ohne Eingabe wird dieses Feedback in
          <span class="font-bold tabular-nums text-gray-800">{{
            remaining()
          }}</span>
          {{ remaining() === 1 ? 'Sekunde' : 'Sekunden' }} verworfen.
        </p>
        <div class="mt-8 flex flex-wrap justify-end gap-4">
          <button
            type="button"
            class="h-14 rounded-2xl bg-gray-100 px-6 text-lg font-medium text-gray-800 hover:bg-gray-200"
            (click)="discard()"
          >
            Jetzt verwerfen
          </button>
          <button
            type="button"
            class="h-14 rounded-2xl bg-accent-600 px-8 text-xl font-bold text-white shadow-md hover:bg-accent-700"
            data-initial-focus
            (click)="keep()"
          >
            Weiter ausfüllen
          </button>
        </div>
        <div
          class="absolute inset-x-0 bottom-0 h-1.5 bg-gray-200"
          aria-hidden="true"
        >
          <div
            class="countdown-bar"
            [style.animation-duration.ms]="countdownMs"
          ></div>
        </div>
      </app-dialog>
    }
  `,
  host: {
    '(document:pointerdown)': 'activity()',
    '(document:keydown)': 'activity()',
    '(document:input)': 'activity()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdleGuardComponent implements OnDestroy {
  private session = inject(FeedbackSessionService);
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private tickTimer: ReturnType<typeof setInterval> | undefined;

  /** Seconds left before the feedback is discarded; null while no warning is shown. */
  protected remaining = signal<number | null>(null);
  protected countdownMs = IDLE_COUNTDOWN_S * 1000;

  private filling = computed(() => {
    const step = this.session.step();
    return step === 'questions' || step === 'review';
  });

  constructor() {
    effect(() => {
      const filling = this.filling();
      untracked(() => (filling ? this.arm() : this.disarm()));
    });
  }

  /** Any tap or keystroke restarts the wait; on the warning only its buttons count. */
  protected activity(): void {
    if (this.filling() && this.remaining() === null) this.arm();
  }

  protected keep(): void {
    this.arm();
  }

  protected discard(): void {
    this.disarm();
    this.session.reset();
  }

  private arm(): void {
    this.disarm();
    this.idleTimer = setTimeout(() => this.warn(), IDLE_WARNING_MS);
  }

  private warn(): void {
    this.remaining.set(IDLE_COUNTDOWN_S);
    this.tickTimer = setInterval(() => {
      const left = (this.remaining() ?? 0) - 1;
      if (left <= 0) {
        this.discard();
      } else {
        this.remaining.set(left);
      }
    }, 1000);
  }

  private disarm(): void {
    clearTimeout(this.idleTimer);
    clearInterval(this.tickTimer);
    this.remaining.set(null);
  }

  ngOnDestroy(): void {
    this.disarm();
  }
}
