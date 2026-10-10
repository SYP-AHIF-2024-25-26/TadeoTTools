import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { FeedbackSessionService } from '@core/services/feedback-session.service';
import { QuestionService } from '@core/services/question.service';
import { OutboxService } from '@core/services/outbox.service';

const timeFormat = new Intl.DateTimeFormat('de-AT', {
  hour: '2-digit',
  minute: '2-digit',
});

@Component({
  selector: 'app-start-page',
  imports: [NgOptimizedImage, FocusOnShowDirective],
  templateUrl: './start-page.component.html',
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartPageComponent {
  protected session = inject(FeedbackSessionService);
  private questionService = inject(QuestionService);
  private outbox = inject(OutboxService);

  protected hasQuestions = computed(
    () => this.questionService.questions().length > 0
  );
  protected loading = this.questionService.loading;
  protected failure = this.questionService.failure;
  protected lastAttempt = computed(() => {
    const at = this.questionService.lastAttempt();
    return at ? timeFormat.format(at) : null;
  });

  protected retry(): void {
    this.questionService.load();
    this.outbox.flush();
  }
}
