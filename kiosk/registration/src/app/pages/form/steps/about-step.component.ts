import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { ReferenceDataService } from '@core/services/reference-data.service';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { moveFocus } from '@shared/radio-keys';
import { ADULT_COUNTS, SCHOOL_LEVELS } from '@shared/constants';

/** Four short questions on one screen, answered with a tap each. */
@Component({
  selector: 'app-about-step',
  imports: [FocusOnShowDirective],
  template: `
    <div class="m-auto w-full max-w-5xl">
      <h1
        class="text-3xl font-bold text-gray-800 md:text-4xl short:text-3xl"
        appFocusOnShow
      >
        Über dich
      </h1>

      <div
        class="mt-6 grid gap-x-12 gap-y-7 sm:mt-8 lg:grid-cols-2 short:mt-4 short:gap-y-5"
      >
        <section>
          <h2 id="gender-label" class="text-xl font-medium text-gray-800">
            Geschlecht
          </h2>
          <div
            class="mt-3 flex flex-wrap gap-3"
            role="radiogroup"
            aria-labelledby="gender-label"
          >
            @for (option of genders; track option.label) {
              <button
                type="button"
                role="radio"
                class="chip min-w-36"
                [attr.aria-checked]="draft().isMale === option.isMale"
                (click)="session.update({ isMale: option.isMale })"
                (keydown)="moveFocus($event)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        </section>

        <section>
          <h2 id="adults-label" class="text-xl font-medium text-gray-800">
            Begleitpersonen
          </h2>
          <p id="adults-hint" class="text-base text-gray-600">
            Erwachsene, die mitgekommen sind
          </p>
          <div
            class="mt-3 flex flex-wrap gap-3"
            role="radiogroup"
            aria-labelledby="adults-label"
            aria-describedby="adults-hint"
          >
            @for (count of adultCounts; track count) {
              <button
                type="button"
                role="radio"
                class="chip tabular-nums"
                [attr.aria-checked]="draft().adults === count"
                (click)="session.update({ adults: count })"
                (keydown)="moveFocus($event)"
              >
                {{ count }}
              </button>
            }
          </div>
        </section>

        <section>
          <h2 id="level-label" class="text-xl font-medium text-gray-800">
            Schulstufe
          </h2>
          <p id="level-hint" class="text-base text-gray-600">
            z. B. 4. Klasse Mittelschule oder AHS = 8. Schulstufe
          </p>
          <div
            class="mt-3 flex flex-wrap gap-3"
            role="radiogroup"
            aria-labelledby="level-label"
            aria-describedby="level-hint"
          >
            @for (level of schoolLevels; track level) {
              <button
                type="button"
                role="radio"
                class="chip tabular-nums"
                [attr.aria-checked]="draft().schoolLevel === level"
                (click)="session.update({ schoolLevel: level })"
                (keydown)="moveFocus($event)"
              >
                {{ level }}
              </button>
            }
          </div>
        </section>

        <section>
          <h2 id="type-label" class="text-xl font-medium text-gray-800">
            Schultyp
          </h2>
          <p class="text-base text-gray-600">
            Die Schule, die du jetzt besuchst
          </p>
          <div
            class="mt-3 flex flex-wrap gap-3"
            role="radiogroup"
            aria-labelledby="type-label"
          >
            @for (type of schoolTypes(); track type) {
              <button
                type="button"
                role="radio"
                class="chip"
                [attr.aria-checked]="draft().schoolType === type"
                (click)="session.update({ schoolType: type })"
                (keydown)="moveFocus($event)"
              >
                {{ type }}
              </button>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  host: { class: 'm-auto flex w-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutStepComponent {
  protected session = inject(RegistrationSessionService);
  protected schoolTypes = inject(ReferenceDataService).schoolTypes;
  protected draft = this.session.draft;
  protected moveFocus = moveFocus;

  protected genders = [
    { label: 'männlich', isMale: true },
    { label: 'weiblich', isMale: false },
  ] as const;
  protected schoolLevels = SCHOOL_LEVELS;
  protected adultCounts = ADULT_COUNTS;
}
