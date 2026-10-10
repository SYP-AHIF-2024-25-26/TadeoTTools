import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { QuestionService } from '@core/services/question.service';
import { OutboxService } from '@core/services/outbox.service';

/**
 * For the students running the tablet: shown on every screen, but only while
 * there is something they need to know (no server, feedback not sent yet).
 */
@Component({
  selector: 'app-status-bar',
  template: `
    @if (isOffline() || pendingCount() > 0) {
      <div
        class="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 bg-gray-100 px-6 py-1.5 text-base text-gray-700"
        role="status"
      >
        @if (isOffline()) {
          <span class="flex min-h-11 items-center gap-2">
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
            Offline – zuletzt geladene Fragen
          </span>
        }
        @if (pendingCount() > 0) {
          <span class="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1">
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
                d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
              />
            </svg>
            <span>
              <span class="font-medium text-gray-900">{{ pendingText() }}</span>
              – Browserdaten nicht löschen
            </span>
            <button
              type="button"
              class="h-11 rounded-xl px-3 font-medium text-gray-900 underline underline-offset-4 hover:bg-gray-200 disabled:no-underline disabled:opacity-70"
              [disabled]="sending()"
              (click)="sendNow()"
            >
              {{ sending() ? 'Wird gesendet …' : 'Jetzt senden' }}
            </button>
          </span>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  private questionService = inject(QuestionService);
  private outbox = inject(OutboxService);

  /** The questions on screen are the cached ones because the last refresh failed. */
  protected isOffline = computed(
    () =>
      this.questionService.failure() !== null &&
      this.questionService.questions().length > 0
  );
  protected pendingCount = computed(() => this.outbox.pending().length);
  protected pendingText = computed(() =>
    this.pendingCount() === 1
      ? '1 Feedback wartet auf die Übertragung'
      : `${this.pendingCount()} Feedbacks warten auf die Übertragung`
  );
  protected sending = this.outbox.sending;

  protected sendNow(): void {
    this.outbox.flush();
  }
}
