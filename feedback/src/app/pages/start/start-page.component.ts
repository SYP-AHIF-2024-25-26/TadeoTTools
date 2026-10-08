import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FeedbackSessionService } from '@core/services/feedback-session.service';
import { QuestionService } from '@core/services/question.service';
import { OutboxService } from '@core/services/outbox.service';

@Component({
  selector: 'app-start-page',
  imports: [NgOptimizedImage],
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
  protected isOffline = computed(() => !this.questionService.isFresh());
  protected pendingCount = computed(() => this.outbox.pending().length);

  protected retry(): void {
    this.questionService.load();
    this.outbox.flush();
  }
}
