import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormStep,
  RegistrationSessionService,
} from '@core/services/registration-session.service';
import { ConfirmCancelDialogComponent } from '@shared/components/confirm-cancel-dialog.component';
import { FocusOnShowDirective } from '@shared/directives/focus-on-show.directive';
import { INTEREST_GROUPS, OTHER_REASON } from '@shared/constants';

interface Row {
  label: string;
  value: string;
  step: FormStep;
}

const INTEREST_LABELS = new Map(
  INTEREST_GROUPS.flatMap((g) => g.options).map((o) => [o.key, o.label])
);

/** Last look before saving; tapping a row opens its step. */
@Component({
  selector: 'app-review-page',
  imports: [ConfirmCancelDialogComponent, FocusOnShowDirective],
  template: `
    <header class="flex items-start gap-6 px-4 pt-4 sm:px-6 sm:pt-6 md:px-10">
      <div class="flex-1">
        <h1 class="text-3xl font-bold text-gray-800 md:text-4xl" appFocusOnShow>
          Alles richtig?
        </h1>
        <p class="mt-2 text-xl text-gray-600">
          Zum Ändern einfach auf eine Angabe tippen.
        </p>
      </div>
      <button
        type="button"
        class="h-12 rounded-2xl px-4 text-lg font-medium text-gray-600 hover:bg-gray-100"
        (click)="confirmCancel.set(true)"
      >
        Abbrechen
      </button>
    </header>

    <main class="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-10 short:py-4">
      <div class="mx-auto flex max-w-5xl items-start gap-3">
        <ul class="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
          @for (row of rows(); track row.label) {
            <li class="flex">
              <button
                type="button"
                class="flex w-full items-center gap-4 rounded-lg bg-white px-5 py-3 text-left shadow-lg hover:bg-gray-50"
                (click)="edit(row.step)"
              >
                <span class="min-w-0 flex-1">
                  <span class="block text-base text-gray-600">{{
                    row.label
                  }}</span>
                  <span
                    class="mt-0.5 block text-xl font-medium text-gray-900 [overflow-wrap:anywhere]"
                    >{{ row.value }}</span
                  >
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </li>
          }
        </ul>
        @if (photo(); as src) {
          <button
            type="button"
            class="hidden shrink-0 flex-col items-center gap-2 rounded-lg bg-white p-3 shadow-lg hover:bg-gray-50 sm:flex"
            (click)="edit('photo')"
          >
            <img
              [src]="src"
              alt="Foto für den Roboterführerschein"
              class="h-48 w-36 rounded-md object-cover"
            />
            <span class="text-base text-gray-600">Foto ändern</span>
          </button>
        }
      </div>
    </main>

    @if (session.saveError(); as error) {
      <div
        class="mx-4 mb-3 rounded-lg border-2 border-red-600 bg-white px-5 py-4 shadow-lg sm:mx-6 md:mx-10"
        role="alert"
      >
        <p class="text-xl font-medium text-red-700">
          Die Anmeldung wurde nicht gespeichert.
        </p>
        <p class="mt-1 text-lg text-gray-700">
          @if (error.kind === 'no-network') {
            Keine Verbindung zum Server. Bitte das WLAN des Tablets prüfen und
            erneut versuchen – alle Angaben bleiben erhalten.
          } @else {
            Der Server meldet einen Fehler{{
              error.status ? ' (' + error.status + ')' : ''
            }}. Bitte erneut versuchen – alle Angaben bleiben erhalten.
          }
        </p>
      </div>
    }

    <footer
      class="flex items-center justify-between gap-4 px-4 pb-3 sm:px-6 sm:pb-6 md:px-10 short:pb-3"
    >
      <button
        type="button"
        class="btn-secondary pl-3 pr-5 sm:pl-5 sm:pr-7"
        [disabled]="session.saving()"
        (click)="session.back()"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2.5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Zurück
      </button>

      <button
        type="button"
        class="btn-primary pl-8 pr-6"
        [disabled]="session.saving()"
        (click)="session.save()"
      >
        @if (session.saving()) {
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 motion-safe:animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              stroke-width="3"
              class="opacity-30"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
          Wird gespeichert …
        } @else {
          {{ session.saveError() ? 'Erneut versuchen' : 'Anmelden' }}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        }
      </button>
    </footer>

    @if (confirmCancel()) {
      <app-confirm-cancel-dialog
        (keep)="confirmCancel.set(false)"
        (discard)="discard()"
      />
    }
  `,
  host: { class: 'flex h-full flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewPageComponent {
  protected session = inject(RegistrationSessionService);
  protected confirmCancel = signal(false);
  protected photo = computed(() => this.session.draft().photo);

  protected rows = computed<Row[]>(() => {
    const d = this.session.draft();
    const city = this.session.city();
    const comment = d.comment.trim();
    const interests = d.interests.map((k) => INTEREST_LABELS.get(k) ?? k);
    return [
      {
        label: 'Wohnort',
        value: city ? `${city.zipCode} ${city.name}` : '–',
        step: 'place',
      },
      {
        label: 'Geschlecht',
        value: d.isMale === null ? '–' : d.isMale ? 'männlich' : 'weiblich',
        step: 'about',
      },
      {
        label: 'Schulstufe',
        value: d.schoolLevel === null ? '–' : `${d.schoolLevel}. Schulstufe`,
        step: 'about',
      },
      { label: 'Schultyp', value: d.schoolType ?? '–', step: 'about' },
      {
        label: 'Begleitpersonen',
        value: d.adults === null ? '–' : `${d.adults}`,
        step: 'about',
      },
      {
        label: 'Erfahren durch',
        value:
          d.reason === OTHER_REASON && comment
            ? `${d.reason}: ${comment}`
            : (d.reason ?? '–'),
        step: 'source',
      },
      {
        label: 'Interessen',
        value: interests.length > 0 ? interests.join(', ') : 'Keine Angabe',
        step: 'interests',
      },
      {
        label: 'Foto',
        value: d.usePhoto ? 'Ja, aufgenommen' : 'Ohne Foto',
        step: 'photo',
      },
    ];
  });

  protected edit(step: FormStep): void {
    if (!this.session.saving()) this.session.edit(step);
  }

  protected discard(): void {
    this.confirmCancel.set(false);
    this.session.reset();
  }
}
