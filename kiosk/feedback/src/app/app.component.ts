import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { FeedbackSessionService } from '@core/services/feedback-session.service';
import { QuestionService } from '@core/services/question.service';
import { OutboxService } from '@core/services/outbox.service';
import { WakeLockService } from '@core/services/wake-lock.service';
import { DivisionService } from '@core/services/division.service';
import { StartPageComponent } from '@pages/start/start-page.component';
import { QuestionPageComponent } from '@pages/question/question-page.component';
import { ReviewPageComponent } from '@pages/review/review-page.component';
import { ThanksPageComponent } from '@pages/thanks/thanks-page.component';
import { IdleGuardComponent } from '@shared/components/idle-guard.component';
import { StatusBarComponent } from '@shared/components/status-bar.component';

/**
 * The kiosk has no routes: the tablet always shows the step of the running
 * feedback, so a reload or a tap on the browser's back button cannot jump into
 * the middle of someone's answers.
 */
@Component({
  selector: 'app-root',
  imports: [
    StartPageComponent,
    QuestionPageComponent,
    ReviewPageComponent,
    ThanksPageComponent,
    IdleGuardComponent,
    StatusBarComponent,
  ],
  template: `
    <app-status-bar />
    <div class="min-h-0 flex-1">
      @switch (session.step()) {
        @case ('start') {
          <app-start-page />
        }
        @case ('questions') {
          <app-question-page />
        }
        @case ('review') {
          <app-review-page />
        }
        @case ('thanks') {
          <app-thanks-page />
        }
      }
    </div>
    <app-idle-guard />
  `,
  host: { class: 'flex h-dvh flex-col select-none text-gray-800' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected session = inject(FeedbackSessionService);
  private swUpdate = inject(SwUpdate);
  private updateReady = signal(false);

  constructor() {
    inject(WakeLockService).keepAwake();
    inject(QuestionService).load();
    inject(DivisionService).load();
    inject(OutboxService).flush();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') this.updateReady.set(true);
      });
    }

    // A new version is only applied between two visitors, never mid-feedback.
    effect(() => {
      if (this.updateReady() && this.session.step() === 'start') {
        document.location.reload();
      }
    });
  }
}
