import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { FeedbackSessionService } from '@core/services/feedback-session.service';
import { ConfirmCancelDialogComponent } from '@shared/components/confirm-cancel-dialog.component';
import {
  isAnswered,
  ratingScale,
  splitMultiple,
  toggleMultiple,
} from '@shared/models/answers';
import { AUTO_ADVANCE_MS } from '@shared/constants';

@Component({
  selector: 'app-question-page',
  imports: [ConfirmCancelDialogComponent],
  templateUrl: './question-page.component.html',
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionPageComponent implements OnDestroy {
  protected session = inject(FeedbackSessionService);
  private advanceTimer: ReturnType<typeof setTimeout> | undefined;

  protected confirmCancel = signal(false);

  protected question = this.session.current;
  protected answer = computed(
    () => this.session.answers()[this.question().id] ?? ''
  );
  protected chosen = computed(() => splitMultiple(this.answer()));
  protected scale = computed(() => ratingScale(this.question()));
  protected progress = computed(() =>
    Math.round((this.session.position() / this.session.visible().length) * 100)
  );
  /** Optional and still empty: the forward button skips instead of continuing. */
  protected isSkip = computed(
    () => !this.question().required && !isAnswered(this.answer())
  );

  /** Single choice and rating move on by themselves after a tap. */
  protected choose(value: string): void {
    this.session.setAnswer(this.question().id, value);
    clearTimeout(this.advanceTimer);
    this.advanceTimer = setTimeout(() => this.session.next(), AUTO_ADVANCE_MS);
  }

  protected toggle(option: string): void {
    this.session.setAnswer(
      this.question().id,
      toggleMultiple(this.answer(), option)
    );
  }

  protected write(text: string): void {
    this.session.setAnswer(this.question().id, text);
  }

  protected next(): void {
    clearTimeout(this.advanceTimer);
    this.session.next();
  }

  protected back(): void {
    clearTimeout(this.advanceTimer);
    this.session.back();
  }

  protected discard(): void {
    this.confirmCancel.set(false);
    this.session.reset();
  }

  ngOnDestroy(): void {
    clearTimeout(this.advanceTimer);
  }
}
