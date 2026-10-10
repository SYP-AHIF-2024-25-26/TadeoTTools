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
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { DivisionService } from '@core/services/division.service';
import {
  isAnswered,
  ratingScale,
  splitMultiple,
  toggleMultiple,
} from '@shared/models/answers';
import { AUTO_ADVANCE_MS } from '@shared/constants';

/**
 * How tightly the answers of a choice question are set. Long lists (one station
 * question has 15 answers) get more columns and lower rows so they fit on one
 * screen; touch targets stay at least 44px tall and text at least 16px.
 */
type Density = 'normal' | 'compact' | 'dense';

const GRID: Record<Density, string> = {
  normal: 'grid gap-3 sm:grid-cols-2 sm:gap-4',
  compact: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
  dense:
    'grid grid-cols-2 gap-1.5 sm:gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4',
};

const OPTION: Record<Density, string> = {
  normal:
    'min-h-16 gap-4 px-5 py-3 text-lg sm:min-h-20 sm:px-6 sm:py-4 sm:text-xl short:min-h-14 short:py-2',
  compact:
    'min-h-14 gap-3 px-4 py-2 text-lg sm:min-h-16 sm:px-5 short:min-h-12',
  dense:
    'min-h-11 gap-2 px-2.5 py-1.5 text-base leading-tight sm:min-h-12 sm:px-3 sm:py-2 sm:leading-snug md:min-h-14 md:gap-3 md:px-4 md:text-lg short:min-h-11 short:text-base',
};

/** Radio circle or checkbox in front of the answer. */
const MARK: Record<Density, string> = {
  normal: 'h-7 w-7',
  compact: 'h-6 w-6',
  dense: 'h-5 w-5 md:h-6 md:w-6',
};

/** Division colour swatch at the end of the answer. */
const SWATCH: Record<Density, string> = {
  normal: 'h-10 w-10',
  compact: 'h-8 w-8',
  dense: 'h-6 w-6 md:h-8 md:w-8',
};

/** Invisible line-break opportunity. */
const ZERO_WIDTH_SPACE = '\u200B';

const ARROW_STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

@Component({
  selector: 'app-question-page',
  imports: [ConfirmCancelDialogComponent, FocusOnShowDirective],
  templateUrl: './question-page.component.html',
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionPageComponent implements OnDestroy {
  protected session = inject(FeedbackSessionService);
  private divisions = inject(DivisionService);
  private advanceTimer: ReturnType<typeof setTimeout> | undefined;

  protected confirmCancel = signal(false);

  protected question = this.session.current;
  protected answer = computed(
    () => this.session.answers()[this.question().id] ?? ''
  );
  protected chosen = computed(() =>
    splitMultiple(this.answer(), this.question().options)
  );
  protected scale = computed(() => ratingScale(this.question()));
  /** Share of the questionnaire reached with the question on screen; 100 on the last one. */
  protected progress = computed(() =>
    Math.round(((this.session.position() + 1) / this.session.total()) * 100)
  );
  protected density = computed<Density>(() => {
    const count = this.question().options?.length ?? 0;
    return count > 8 ? 'dense' : count > 6 ? 'compact' : 'normal';
  });
  /** A long answer list leaves less room for the question on phones. */
  protected headingClass = computed(() =>
    this.density() === 'dense'
      ? 'text-xl sm:text-3xl md:text-4xl short:text-xl'
      : 'text-2xl sm:text-3xl md:text-4xl short:text-2xl'
  );
  protected gridClass = computed(() => GRID[this.density()]);
  protected optionClass = computed(() => OPTION[this.density()]);
  protected markClass = computed(() => MARK[this.density()]);
  protected swatchClass = computed(() => SWATCH[this.density()]);

  /** Optional and still empty: the forward button skips instead of continuing. */
  protected isSkip = computed(
    () => !this.question().required && !isAnswered(this.answer())
  );

  /** Question whose "Weiter" was tapped without the required answer. */
  private hintFor = signal<number | null>(null);
  /** Explains the `*` right when it stops the visitor; gone once answered. */
  protected showHint = computed(
    () => this.hintFor() === this.question().id && !this.session.canContinue()
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
      toggleMultiple(this.answer(), option, this.question().options)
    );
  }

  /** Lets a narrow answer wrap after "/" ("Video/Tonstudio") instead of inside a word. */
  protected breakable(option: string): string {
    return option.replaceAll('/', '/' + ZERO_WIDTH_SPACE);
  }

  /** The division's colour when an answer names a division, e.g. "Informatik". */
  protected divisionColor(option: string): string | null {
    return this.divisions.colorFor(option);
  }

  /** Arrow keys move between the answers of a single choice or rating question. */
  protected moveFocus(event: KeyboardEvent): void {
    const step = ARROW_STEPS[event.key];
    if (!step) return;
    const group = (event.currentTarget as HTMLElement).closest(
      '[role="radiogroup"]'
    );
    if (!group) return;
    const radios = Array.from(
      group.querySelectorAll<HTMLElement>('[role="radio"]')
    );
    const index = radios.indexOf(document.activeElement as HTMLElement);
    if (index < 0) return;
    event.preventDefault();
    radios[(index + step + radios.length) % radios.length].focus();
  }

  protected write(text: string): void {
    this.session.setAnswer(this.question().id, text);
  }

  protected next(): void {
    clearTimeout(this.advanceTimer);
    if (!this.session.canContinue()) {
      this.hintFor.set(this.question().id);
      return;
    }
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
