import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { InterestKey } from '@shared/models/types';
import { INTEREST_GROUPS } from '@shared/constants';

/** Optional: any number of branches, or none. */
@Component({
  selector: 'app-interests-step',
  imports: [FocusOnShowDirective],
  template: `
    <div class="m-auto w-full max-w-5xl">
      <h1
        class="text-3xl font-bold text-gray-800 md:text-4xl short:text-3xl"
        appFocusOnShow
      >
        Was interessiert dich?
      </h1>
      <p class="mt-2 text-xl text-gray-600">
        Mehrfachauswahl möglich – oder einfach weiter.
      </p>

      @for (group of groups; track group.title; let g = $index) {
        <section class="mt-7 short:mt-4">
          <h2 [id]="'group-' + g" class="text-xl font-medium text-gray-800">
            {{ group.title }}
          </h2>
          <div
            class="mt-3 grid gap-3 sm:grid-cols-2"
            [class.lg:grid-cols-4]="group.options.length === 4"
            [class.lg:grid-cols-3]="group.options.length === 3"
            role="group"
            [attr.aria-labelledby]="'group-' + g"
          >
            @for (option of group.options; track option.key) {
              <button
                type="button"
                role="checkbox"
                class="choice min-h-20 px-5 py-3 text-xl font-medium short:min-h-16"
                [attr.aria-checked]="chosen().includes(option.key)"
                (click)="toggle(option.key)"
              >
                <span class="mark-check">
                  @if (chosen().includes(option.key)) {
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      stroke-width="3"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  }
                </span>
                <span class="min-w-0 flex-1 hyphens-auto">{{
                  option.label
                }}</span>
              </button>
            }
          </div>
        </section>
      }
    </div>
  `,
  host: { class: 'm-auto flex w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterestsStepComponent {
  private session = inject(RegistrationSessionService);
  protected groups = INTEREST_GROUPS;
  protected chosen = computed(() => this.session.draft().interests);

  protected toggle(key: InterestKey): void {
    const chosen = this.chosen();
    this.session.update({
      interests: chosen.includes(key)
        ? chosen.filter((k) => k !== key)
        : [...chosen, key],
    });
  }
}
