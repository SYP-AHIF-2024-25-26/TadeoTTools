import { computed, inject, Injectable, signal } from '@angular/core';
import { QuestionService } from './question.service';
import { OutboxService } from './outbox.service';
import { AnswerMap, FeedbackSubmission } from '@shared/models/types';
import { isAnswered, visibleQuestions } from '@shared/models/answers';
import { THANKS_SCREEN_MS } from '@shared/constants';

export type Step = 'start' | 'questions' | 'review' | 'thanks';

/** The feedback of the visitor currently at the tablet, from start to thank-you. */
@Injectable({
  providedIn: 'root',
})
export class FeedbackSessionService {
  private questionService = inject(QuestionService);
  private outbox = inject(OutboxService);
  private thanksTimer: ReturnType<typeof setTimeout> | undefined;

  readonly step = signal<Step>('start');
  readonly answers = signal<AnswerMap>({});
  private readonly index = signal(0);

  readonly visible = computed(() =>
    visibleQuestions(this.questionService.questions(), this.answers())
  );
  readonly position = computed(() =>
    Math.min(this.index(), this.visible().length - 1)
  );
  readonly current = computed(() => this.visible()[this.position()]);
  readonly isFirst = computed(() => this.position() === 0);
  readonly isLast = computed(
    () => this.position() === this.visible().length - 1
  );
  readonly canContinue = computed(() => {
    const question = this.current();
    return !question?.required || isAnswered(this.answers()[question.id]);
  });

  /** Only answered questions that are shown; the backend rejects empty answers. */
  readonly submissions = computed<FeedbackSubmission[]>(() =>
    this.visible()
      .filter((q) => isAnswered(this.answers()[q.id]))
      .map((q) => ({ questionId: q.id, answer: this.answers()[q.id].trim() }))
  );

  readonly missingRequired = computed(() =>
    this.visible().filter(
      (q) => q.required && !isAnswered(this.answers()[q.id])
    )
  );

  start(): void {
    if (this.questionService.questions().length === 0) return;
    this.answers.set({});
    this.index.set(0);
    this.step.set('questions');
  }

  setAnswer(questionId: number, answer: string): void {
    this.answers.update((prev) => ({ ...prev, [questionId]: answer }));
  }

  next(): void {
    if (!this.canContinue()) return;
    if (this.isLast()) {
      this.step.set('review');
    } else {
      this.index.set(this.position() + 1);
    }
  }

  back(): void {
    if (this.step() === 'review') {
      this.step.set('questions');
    } else if (!this.isFirst()) {
      this.index.set(this.position() - 1);
    }
  }

  edit(questionId: number): void {
    const index = this.visible().findIndex((q) => q.id === questionId);
    if (index < 0) return;
    this.index.set(index);
    this.step.set('questions');
  }

  submit(): void {
    if (this.submissions().length === 0 || this.missingRequired().length > 0) {
      return;
    }
    this.outbox.add(this.submissions());
    this.step.set('thanks');
    this.thanksTimer = setTimeout(() => this.reset(), THANKS_SCREEN_MS);
  }

  /** Discards the running feedback and gets the tablet ready for the next visitor. */
  reset(): void {
    clearTimeout(this.thanksTimer);
    this.answers.set({});
    this.index.set(0);
    this.step.set('start');
    this.questionService.load();
  }
}
