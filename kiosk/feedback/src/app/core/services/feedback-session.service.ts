import { computed, inject, Injectable, signal } from '@angular/core';
import { QuestionService } from './question.service';
import { OutboxService } from './outbox.service';
import { DivisionService } from './division.service';
import { AnswerMap, FeedbackSubmission } from '@shared/models/types';
import {
  isAnswered,
  possibleQuestions,
  visibleQuestions,
} from '@shared/models/answers';
import { THANKS_SCREEN_MS } from '@shared/constants';

export type Step = 'start' | 'questions' | 'review' | 'thanks';

/** The feedback of the visitor currently at the tablet, from start to thank-you. */
@Injectable({
  providedIn: 'root',
})
export class FeedbackSessionService {
  private questionService = inject(QuestionService);
  private outbox = inject(OutboxService);
  private divisions = inject(DivisionService);
  private thanksTimer: ReturnType<typeof setTimeout> | undefined;

  readonly step = signal<Step>('start');
  readonly answers = signal<AnswerMap>({});
  private readonly index = signal(0);
  /** Questions this visitor has already been shown. */
  private readonly seen = signal<ReadonlySet<number>>(new Set());
  /** True after tapping an answer in the overview, until the overview is back. */
  readonly editing = signal(false);

  readonly visible = computed(() =>
    visibleQuestions(this.questionService.questions(), this.answers())
  );
  /** N in "Frage x von N": shown questions plus those that may still appear. */
  readonly total = computed(
    () =>
      possibleQuestions(this.questionService.questions(), this.answers()).length
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

  /**
   * While editing, the next question still to show: one that the edited answer
   * has just revealed. -1 when "Weiter" goes straight back to the overview.
   */
  private readonly nextUnseen = computed(() => {
    const seen = this.seen();
    return this.visible().findIndex(
      (q, i) => i > this.position() && !seen.has(q.id)
    );
  });

  /** The forward button leads to the overview instead of the next question. */
  readonly returnsToReview = computed(
    () => this.editing() && this.nextUnseen() < 0
  );

  start(): void {
    if (this.questionService.questions().length === 0) return;
    this.answers.set({});
    this.seen.set(new Set());
    this.editing.set(false);
    this.show(0);
    this.step.set('questions');
  }

  setAnswer(questionId: number, answer: string): void {
    this.answers.update((prev) => ({ ...prev, [questionId]: answer }));
  }

  next(): void {
    if (!this.canContinue()) return;
    if (this.editing()) {
      const unseen = this.nextUnseen();
      if (unseen < 0) {
        this.toReview();
      } else {
        this.show(unseen);
      }
    } else if (this.isLast()) {
      this.toReview();
    } else {
      this.show(this.position() + 1);
    }
  }

  back(): void {
    if (this.step() === 'review') {
      this.show(this.visible().length - 1);
      this.step.set('questions');
    } else if (!this.isFirst()) {
      this.show(this.position() - 1);
    }
  }

  /** Opens one answer from the overview; "Weiter" then returns to the overview. */
  edit(questionId: number): void {
    const index = this.visible().findIndex((q) => q.id === questionId);
    if (index < 0) return;
    this.editing.set(true);
    this.show(index);
    this.step.set('questions');
  }

  private show(index: number): void {
    this.index.set(index);
    const question = this.visible()[index];
    if (question) {
      this.seen.update((prev) => new Set(prev).add(question.id));
    }
  }

  private toReview(): void {
    this.editing.set(false);
    this.step.set('review');
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
    this.seen.set(new Set());
    this.editing.set(false);
    this.index.set(0);
    this.step.set('start');
    this.questionService.load();
    this.divisions.load();
  }
}
