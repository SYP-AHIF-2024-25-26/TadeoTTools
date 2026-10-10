import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { ReferenceDataService } from '@core/services/reference-data.service';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { moveFocus } from '@shared/radio-keys';
import { AUTO_ADVANCE_MS, OTHER_REASON } from '@shared/constants';

/** One tap moves on, except "Anderes", which asks what exactly. */
@Component({
  selector: 'app-source-step',
  imports: [FocusOnShowDirective],
  template: `
    <div class="m-auto w-full max-w-6xl">
      <h1
        id="source-title"
        class="text-3xl font-bold text-gray-800 md:text-4xl short:text-3xl"
        appFocusOnShow
      >
        Wie hast du von uns erfahren?
      </h1>

      <div
        class="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 short:mt-4"
        role="radiogroup"
        aria-labelledby="source-title"
      >
        @for (reason of reasons(); track reason) {
          <button
            type="button"
            role="radio"
            class="choice min-h-16 px-4 py-2 text-lg sm:text-xl short:min-h-14"
            [attr.aria-checked]="selected() === reason"
            (click)="choose(reason)"
            (keydown)="moveFocus($event)"
          >
            <span class="mark-radio"></span>
            <span
              class="min-w-0 flex-1 hyphens-auto [overflow-wrap:anywhere]"
              >{{ reason }}</span
            >
          </button>
        }
      </div>

      @if (selected() === other) {
        <div class="mt-6 max-w-2xl">
          <label for="comment" class="text-xl font-medium text-gray-800">
            Was genau?
            <span class="font-normal text-gray-600">(freiwillig)</span>
          </label>
          <input
            #comment
            id="comment"
            type="text"
            maxlength="200"
            autocomplete="off"
            enterkeyhint="next"
            class="mt-2 h-16 w-full select-text rounded-lg border border-gray-500 bg-white px-5 text-xl caret-accent-600 shadow-lg placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-[3px] focus:ring-accent-600"
            placeholder="z. B. Instagram, Elternabend …"
            [value]="session.draft().comment"
            (input)="session.update({ comment: comment.value })"
            (keydown.enter)="session.next()"
          />
        </div>
      }
    </div>
  `,
  host: { class: 'm-auto flex w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceStepComponent implements OnDestroy {
  protected session = inject(RegistrationSessionService);
  protected reasons = inject(ReferenceDataService).reasons;
  private injector = inject(Injector);
  private advanceTimer: ReturnType<typeof setTimeout> | undefined;
  private comment = viewChild<ElementRef<HTMLInputElement>>('comment');

  protected other = OTHER_REASON;
  protected moveFocus = moveFocus;
  protected selected = computed(() => this.session.draft().reason);

  protected choose(reason: string): void {
    clearTimeout(this.advanceTimer);
    this.session.update({ reason });
    if (reason === OTHER_REASON) {
      afterNextRender(() => this.comment()?.nativeElement.focus(), {
        injector: this.injector,
      });
    } else {
      // Short pause, so the choice is visible before the next step appears.
      this.advanceTimer = setTimeout(
        () => this.session.next(),
        AUTO_ADVANCE_MS
      );
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.advanceTimer);
  }
}
