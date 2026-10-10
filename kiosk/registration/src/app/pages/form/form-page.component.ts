import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RegistrationSessionService } from '@core/services/registration-session.service';
import { ConfirmCancelDialogComponent } from '@shared/components/confirm-cancel-dialog.component';
import { StepBarComponent } from './step-bar.component';
import { PlaceStepComponent } from './steps/place-step.component';
import { AboutStepComponent } from './steps/about-step.component';
import { SourceStepComponent } from './steps/source-step.component';
import { InterestsStepComponent } from './steps/interests-step.component';
import { PhotoStepComponent } from './steps/photo-step.component';

/** Frame of the five form steps: step bar, the step itself, Zurück / Weiter. */
@Component({
  selector: 'app-form-page',
  imports: [
    ConfirmCancelDialogComponent,
    StepBarComponent,
    PlaceStepComponent,
    AboutStepComponent,
    SourceStepComponent,
    InterestsStepComponent,
    PhotoStepComponent,
  ],
  template: `
    <header
      class="flex items-start gap-4 px-4 pt-3 sm:gap-6 sm:px-6 sm:pt-5 md:px-10 short:pt-3"
    >
      <app-step-bar class="flex-1" [current]="session.formIndex()" />
      <button
        type="button"
        class="-mt-2.5 h-11 rounded-2xl px-3 text-base font-medium text-gray-600 hover:bg-gray-100 sm:h-12 sm:px-4 sm:text-lg"
        (click)="confirmCancel.set(true)"
      >
        Abbrechen
      </button>
    </header>

    <main
      class="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-8 md:px-10 short:py-3"
    >
      @switch (session.formStep()) {
        @case ('place') {
          <app-place-step />
        }
        @case ('about') {
          <app-about-step />
        }
        @case ('source') {
          <app-source-step />
        }
        @case ('interests') {
          <app-interests-step />
        }
        @case ('photo') {
          <app-photo-step />
        }
      }
    </main>

    <footer
      class="flex flex-wrap items-center justify-between gap-3 px-4 pb-3 sm:gap-4 sm:px-6 sm:pb-6 md:px-10 short:pb-3"
    >
      <button
        type="button"
        class="btn-secondary pl-3 pr-5 disabled:invisible sm:pl-5 sm:pr-7"
        [disabled]="session.isFirst()"
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

      @if (hint(); as text) {
        <p
          id="step-hint"
          class="order-first w-full text-lg font-medium text-accent-800 sm:order-none sm:w-auto sm:flex-1 sm:text-right sm:text-xl"
          role="alert"
        >
          {{ text }}
        </p>
      }

      <button
        type="button"
        class="btn-primary shrink-0 pl-7 pr-5"
        [attr.aria-disabled]="!session.canContinue()"
        [attr.aria-describedby]="hint() ? 'step-hint' : null"
        (click)="next()"
      >
        {{ session.editing() ? 'Zur Übersicht' : 'Weiter' }}
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
            d="M9 5l7 7-7 7"
          />
        </svg>
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
export class FormPageComponent {
  protected session = inject(RegistrationSessionService);
  protected confirmCancel = signal(false);
  /** Set when "Weiter" was tapped on an incomplete step. */
  private tried = signal(false);

  /** What is still missing, shown only after an attempt to move on. */
  protected hint = computed(() => {
    if (!this.tried() || this.session.canContinue()) return null;
    const d = this.session.draft();
    switch (this.session.formStep()) {
      case 'place':
        return 'Bitte Postleitzahl eingeben und Ort wählen.';
      case 'about': {
        const missing = [
          d.isMale === null && 'Geschlecht',
          d.schoolLevel === null && 'Schulstufe',
          d.schoolType === null && 'Schultyp',
          d.adults === null && 'Begleitpersonen',
        ].filter(Boolean);
        return `Noch offen: ${missing.join(', ')}`;
      }
      case 'source':
        return 'Bitte eine Antwort wählen.';
      case 'photo':
        return d.usePhoto === null
          ? 'Bitte „Ja“ oder „Nein“ wählen.'
          : 'Bitte ein Foto aufnehmen – oder „Nein, ohne Foto“.';
      default:
        return null;
    }
  });

  constructor() {
    // A new step starts without a complaint.
    effect(() => {
      this.session.formIndex();
      untracked(() => this.tried.set(false));
    });
  }

  protected next(): void {
    if (this.session.canContinue()) {
      this.session.next();
    } else {
      this.tried.set(true);
    }
  }

  protected discard(): void {
    this.confirmCancel.set(false);
    this.session.reset();
  }
}
