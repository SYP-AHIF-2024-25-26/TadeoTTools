import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { ReferenceDataService } from '@core/services/reference-data.service';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { moveFocus } from '@shared/radio-keys';
import { AUTO_ADVANCE_MS, ZIP_LENGTH } from '@shared/constants';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

/**
 * Postcode on a built-in number pad (no on-screen keyboard covering half the
 * tablet), then the town. A postcode with a single town picks it right away;
 * tapping a town moves on to the next step.
 */
@Component({
  selector: 'app-place-step',
  imports: [FocusOnShowDirective],
  template: `
    <div
      class="m-auto grid w-full max-w-5xl gap-x-12 gap-y-8 md:grid-cols-[auto_1fr] md:items-start"
    >
      <section aria-labelledby="place-title">
        <h1
          id="place-title"
          class="text-3xl font-bold text-gray-800 md:text-4xl short:text-3xl"
          appFocusOnShow
        >
          Woher kommst du?
        </h1>
        <p id="zip-label" class="mt-2 text-xl text-gray-600">Postleitzahl</p>

        <!-- The four digits typed so far; the next box is marked -->
        <div
          class="mt-4 flex gap-3"
          role="group"
          aria-labelledby="zip-label"
          aria-live="polite"
        >
          <span class="sr-only">{{ zip() || 'leer' }}</span>
          @for (box of boxes(); track $index) {
            <span
              class="flex h-20 w-16 items-center justify-center rounded-lg border-[3px] bg-white text-4xl font-bold tabular-nums text-gray-900 shadow-md short:h-16 short:w-14 short:text-3xl"
              [class.border-accent-600]="box.next"
              [class.border-red-600]="notFound()"
              [class.border-transparent]="!box.next && !notFound()"
              aria-hidden="true"
              >{{ box.digit }}</span
            >
          }
        </div>

        <div
          class="mt-6 grid w-[19rem] grid-cols-3 gap-3 short:mt-4 short:w-[17rem] short:gap-2"
        >
          @for (key of keys; track key) {
            <button
              type="button"
              class="h-16 rounded-2xl bg-white text-3xl font-medium text-gray-800 shadow-md hover:bg-gray-100 active:bg-accent-50 disabled:opacity-40 short:h-14"
              [disabled]="zip().length >= zipLength"
              (click)="type(key)"
            >
              {{ key }}
            </button>
          }
          <button
            type="button"
            class="h-16 rounded-2xl text-lg font-medium text-gray-700 hover:bg-gray-200 disabled:invisible short:h-14"
            [disabled]="zip() === ''"
            (click)="clear()"
          >
            Leeren
          </button>
          <button
            type="button"
            class="h-16 rounded-2xl bg-white text-3xl font-medium text-gray-800 shadow-md hover:bg-gray-100 active:bg-accent-50 disabled:opacity-40 short:h-14"
            [disabled]="zip().length >= zipLength"
            (click)="type('0')"
          >
            0
          </button>
          <button
            type="button"
            class="flex h-16 items-center justify-center rounded-2xl bg-white text-gray-800 shadow-md hover:bg-gray-100 disabled:opacity-40 short:h-14"
            aria-label="Letzte Ziffer löschen"
            [disabled]="zip() === ''"
            (click)="erase()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 5H9l-6 7 6 7h12a1 1 0 001-1V6a1 1 0 00-1-1zM17 9l-5 6m0-6l5 6"
              />
            </svg>
          </button>
        </div>
      </section>

      <section class="min-w-0 md:pt-[5.5rem]" aria-labelledby="town-title">
        <h2 id="town-title" class="text-xl font-medium text-gray-800">Ort</h2>
        @if (zip().length < zipLength) {
          <p class="mt-3 text-lg text-gray-600">
            Nach der vierten Ziffer erscheinen hier die Orte.
          </p>
        } @else if (notFound()) {
          <div class="mt-3" role="alert">
            <p class="text-xl font-medium text-red-700">
              Keine Orte mit der Postleitzahl {{ zip() }}.
            </p>
            <p class="mt-1 text-lg text-gray-600">
              Bitte die Postleitzahl prüfen und korrigieren. Die Liste kennt nur
              österreichische Postleitzahlen.
            </p>
          </div>
        } @else {
          <div
            class="mt-3 grid gap-3 lg:grid-cols-2"
            role="radiogroup"
            aria-labelledby="town-title"
          >
            @for (city of towns(); track city.id) {
              <button
                type="button"
                role="radio"
                class="choice min-h-20 px-5 py-3 short:min-h-16"
                [attr.aria-checked]="city.id === cityId()"
                (click)="pick(city.id)"
                (keydown)="moveFocus($event)"
              >
                <span class="mark-radio"></span>
                <span
                  class="min-w-0 flex-1 text-xl font-medium [overflow-wrap:anywhere]"
                  >{{ city.name }}</span
                >
              </button>
            }
          </div>
        }
      </section>
    </div>
  `,
  host: {
    class: 'm-auto flex w-full',
    '(document:keydown)': 'onKey($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceStepComponent implements OnDestroy {
  private session = inject(RegistrationSessionService);
  private advanceTimer: ReturnType<typeof setTimeout> | undefined;
  private reference = inject(ReferenceDataService);

  protected keys = KEYS;
  protected zipLength = ZIP_LENGTH;
  protected moveFocus = moveFocus;

  protected zip = computed(() => this.session.draft().zip);
  protected cityId = computed(() => this.session.draft().cityId);
  protected towns = computed(() =>
    this.zip().length === ZIP_LENGTH
      ? (this.reference.citiesByZip().get(this.zip()) ?? [])
      : []
  );
  protected notFound = computed(
    () => this.zip().length === ZIP_LENGTH && this.towns().length === 0
  );
  protected boxes = computed(() => {
    const zip = this.zip();
    return Array.from({ length: ZIP_LENGTH }, (_, i) => ({
      digit: zip[i] ?? '',
      next: i === zip.length,
    }));
  });

  protected type(digit: string): void {
    if (this.zip().length >= ZIP_LENGTH) return;
    this.setZip(this.zip() + digit);
  }

  protected erase(): void {
    this.setZip(this.zip().slice(0, -1));
  }

  protected clear(): void {
    this.setZip('');
  }

  /** Picking the town finishes the step; a short pause shows the choice first. */
  protected pick(cityId: number): void {
    clearTimeout(this.advanceTimer);
    this.session.update({ cityId });
    this.advanceTimer = setTimeout(() => this.session.next(), AUTO_ADVANCE_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.advanceTimer);
  }

  /** A hardware keyboard works too (handy when testing on a laptop). */
  protected onKey(event: KeyboardEvent): void {
    if (document.querySelector('[aria-modal="true"]')) return;
    if (/^[0-9]$/.test(event.key)) {
      this.type(event.key);
    } else if (event.key === 'Backspace') {
      this.erase();
    } else {
      return;
    }
    event.preventDefault();
  }

  private setZip(zip: string): void {
    // Correcting the postcode right after a tap on a town cancels moving on.
    clearTimeout(this.advanceTimer);
    const towns =
      zip.length === ZIP_LENGTH
        ? (this.reference.citiesByZip().get(zip) ?? [])
        : [];
    this.session.update({
      zip,
      cityId: towns.length === 1 ? towns[0].id : null,
    });
  }
}
