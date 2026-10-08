import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FeedbackSessionService } from '@core/services/feedback-session.service';
import { ConfirmCancelDialogComponent } from '@shared/components/confirm-cancel-dialog.component';
import { isAnswered } from '@shared/models/answers';

/** Last look at all answers before sending; tapping a row edits that answer. */
@Component({
  selector: 'app-review-page',
  imports: [ConfirmCancelDialogComponent],
  templateUrl: './review-page.component.html',
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPageComponent {
  protected session = inject(FeedbackSessionService);

  protected confirmCancel = signal(false);

  protected rows = computed(() =>
    this.session.visible().map((q) => {
      const answer = this.session.answers()[q.id] ?? '';
      return {
        id: q.id,
        question: q.question,
        answer: answer.trim(),
        answered: isAnswered(answer),
        missing: q.required && !isAnswered(answer),
      };
    })
  );

  protected canSubmit = computed(
    () =>
      this.session.submissions().length > 0 &&
      this.session.missingRequired().length === 0
  );

  protected discard(): void {
    this.confirmCancel.set(false);
    this.session.reset();
  }
}
