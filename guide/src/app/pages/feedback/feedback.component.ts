import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  type OnDestroy,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  Division,
  FeedbackQuestion,
  FeedbackSubmission,
} from '@shared/models/types';
import { divisionColorFor } from '@shared/division-colors';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { FeedbackOutboxService } from '@core/services/feedback-outbox.service';
import { isPreview } from '@core/preview';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { LoadErrorComponent } from '@shared/components/load-state/load-error.component';
import { CardSkeletonComponent } from '@shared/components/load-state/card-skeleton.component';
import {
  AnswerMap,
  isAnswered,
  possibleQuestions,
  ratingScale,
  splitMultiple,
  toggleMultiple,
  visibleQuestions,
} from '@shared/feedback-answers';
import {
  FEEDBACK_DRAFT,
  FEEDBACK_SUBMITTED,
} from '@shared/constants/constants';

interface Draft {
  position: number;
  answers: AnswerMap;
}

/** Pause after tapping a single choice or rating so the selection is visible. */
const AUTO_ADVANCE_MS = 500;

/**
 * The visitor's feedback, one question per screen. The band says where they are
 * ("Frage 2 von 6" and a step band); a tap on a single choice or rating moves on by
 * itself. Finished feedback goes through the outbox, so it survives a Wi-Fi gap.
 */
@Component({
  selector: 'app-feedback',
  imports: [
    HeaderComponent,
    NavbarComponent,
    LoadErrorComponent,
    CardSkeletonComponent,
  ],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(swipeleft)': 'router.navigate(["/about"])',
    '(swiperight)': 'router.navigate(["/map"])',
  },
})
export class FeedbackComponent implements OnInit, OnDestroy {
  protected router = inject(Router);
  private api = inject(ApiFetchService);
  private outbox = inject(FeedbackOutboxService);
  private injector = inject(Injector);

  protected questions = signal<FeedbackQuestion[]>([]);
  private divisions = signal<Division[]>([]);
  protected loadState = signal<'loading' | 'ready' | 'error'>('loading');
  protected view = signal<'questions' | 'thanks'>('questions');
  protected answers = signal<AnswerMap>({});
  protected position = signal(0);
  protected showRequired = signal(false);

  private heading = viewChild<ElementRef<HTMLElement>>('heading');
  private advanceTimer?: ReturnType<typeof setTimeout>;

  protected visible = computed(() =>
    visibleQuestions(this.questions(), this.answers())
  );
  protected total = computed(
    () => possibleQuestions(this.questions(), this.answers()).length
  );
  protected index = computed(() =>
    Math.min(this.position(), Math.max(this.visible().length - 1, 0))
  );
  protected current = computed<FeedbackQuestion | undefined>(
    () => this.visible()[this.index()]
  );
  protected isLast = computed(() => this.index() === this.visible().length - 1);
  protected answer = computed(() => {
    const question = this.current();
    return question ? (this.answers()[question.id!] ?? '') : '';
  });
  protected answered = computed(() => isAnswered(this.answer()));

  protected primaryLabel = computed(() => {
    if (this.isLast()) return 'Absenden';
    return this.answered() || this.current()?.required
      ? 'Weiter'
      : 'Überspringen';
  });

  /** One segment per question that may still come; the ones up to here stand tall. */
  protected steps = computed(() =>
    Array.from({ length: this.total() }, (_, i) => i <= this.index())
  );

  protected scale = computed(() => {
    const question = this.current();
    return question?.type === 'Rating' ? ratingScale(question) : [];
  });
  /** Up to 7 values in one row, more in two. */
  protected scaleColumns = computed(() => {
    const count = this.scale().length;
    return count <= 7 ? count : Math.ceil(count / 2);
  });
  protected chosenRating = computed(() =>
    this.scale().find((s) => String(s.value) === this.answer())
  );
  protected scaleEnds = computed(() => {
    const scale = this.scale();
    const first = scale[0]?.label;
    const last = scale[scale.length - 1]?.label;
    return first || last ? { first, last } : null;
  });

  /** The thanks line reads the outbox, so it changes once queued feedback goes out. */
  protected sent = computed(() => this.outbox.pending().length === 0);

  constructor() {
    effect(() => {
      if (this.view() !== 'questions' || this.loadState() !== 'ready') return;
      const draft: Draft = {
        position: this.position(),
        answers: this.answers(),
      };
      try {
        sessionStorage.setItem(FEEDBACK_DRAFT, JSON.stringify(draft));
      } catch {
        // Storage blocked: the answers only would not survive a tab switch.
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const draft = readDraft();
    if (draft) {
      this.answers.set(draft.answers);
      this.position.set(draft.position);
    } else if (localStorage.getItem(FEEDBACK_SUBMITTED) === 'true') {
      this.view.set('thanks');
    }
    this.loadDivisions();
    await this.loadQuestions();
  }

  ngOnDestroy(): void {
    clearTimeout(this.advanceTimer);
  }

  async loadQuestions(): Promise<void> {
    this.loadState.set('loading');
    try {
      this.questions.set(await this.api.getAllFeedbackQuestions());
    } catch {
      // A network error is not "no questions": say so and offer a retry.
      this.loadState.set('error');
      return;
    }
    this.loadState.set('ready');
  }

  /** An answer naming a division ("Informatik") wears its exact colour, like a stop card. */
  protected divisionColor(option: string): string | null {
    return divisionColorFor(option, this.divisions());
  }

  protected isChosen(option: string): boolean {
    const question = this.current();
    if (!question) return false;
    return question.type === 'MultipleChoice'
      ? splitMultiple(this.answer(), question.options).includes(option)
      : this.answer() === option;
  }

  protected choose(option: string): void {
    const question = this.current();
    if (!question) return;
    if (question.type === 'MultipleChoice') {
      this.setAnswer(toggleMultiple(this.answer(), option, question.options));
      return;
    }
    this.setAnswer(option);
    this.advanceSoon();
  }

  protected rate(value: number): void {
    this.setAnswer(String(value));
    this.advanceSoon();
  }

  protected write(text: string): void {
    this.setAnswer(text);
  }

  protected next(): void {
    clearTimeout(this.advanceTimer);
    if (this.current()?.required && !this.answered()) {
      this.showRequired.set(true);
      return;
    }
    if (this.isLast()) {
      this.submit();
    } else {
      this.goTo(this.index() + 1);
    }
  }

  protected previous(): void {
    clearTimeout(this.advanceTimer);
    this.goTo(this.index() - 1);
  }

  /** Starts a new feedback on the same phone, e.g. a parent after their child. */
  protected startNew(): void {
    this.answers.set({});
    this.position.set(0);
    this.showRequired.set(false);
    this.view.set('questions');
    this.focusHeading();
  }

  private async loadDivisions(): Promise<void> {
    try {
      this.divisions.set(await this.api.getDivisions());
    } catch {
      // Colours are a visual aid only: without them the answers stay white.
    }
  }

  private setAnswer(value: string): void {
    const id = this.current()?.id;
    if (id === undefined) return;
    this.answers.update((all) => ({ ...all, [id]: value }));
    if (isAnswered(value)) this.showRequired.set(false);
  }

  /** Single choice and rating move on by themselves, but never send the feedback. */
  private advanceSoon(): void {
    clearTimeout(this.advanceTimer);
    if (this.isLast()) return;
    const question = this.current();
    this.advanceTimer = setTimeout(() => {
      if (this.current() === question) this.next();
    }, AUTO_ADVANCE_MS);
  }

  private goTo(position: number): void {
    this.position.set(Math.max(position, 0));
    this.showRequired.set(false);
    this.focusHeading();
  }

  private submit(): void {
    // Only answered, still visible questions: the backend rejects empty answers.
    const answers = this.answers();
    const submissions: FeedbackSubmission[] = this.visible()
      .filter((q) => isAnswered(answers[q.id!]))
      .map((q) => ({ questionId: q.id!, answer: answers[q.id!].trim() }));
    if (submissions.length > 0) {
      this.outbox.add(submissions);
    }
    try {
      // The preview does not remember it, so the form can be tested again.
      if (!isPreview) localStorage.setItem(FEEDBACK_SUBMITTED, 'true');
      sessionStorage.removeItem(FEEDBACK_DRAFT);
    } catch {
      // Storage blocked: the page just opens on the questions next time.
    }
    this.view.set('thanks');
    this.focusHeading();
  }

  /** Each step starts at the top, with the screen reader on the new heading. */
  private focusHeading(): void {
    afterNextRender(
      () => {
        window.scrollTo({ top: 0 });
        this.heading()?.nativeElement.focus({ preventScroll: true });
      },
      { injector: this.injector }
    );
  }
}

function readDraft(): Draft | null {
  try {
    const stored = sessionStorage.getItem(FEEDBACK_DRAFT);
    const draft: unknown = stored ? JSON.parse(stored) : null;
    if (
      draft &&
      typeof draft === 'object' &&
      'position' in draft &&
      'answers' in draft
    ) {
      return draft as Draft;
    }
  } catch {
    // Unreadable draft: start fresh.
  }
  return null;
}
