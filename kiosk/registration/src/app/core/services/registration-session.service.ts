import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RegistrationApiService } from './registration-api.service';
import { ReferenceDataService } from './reference-data.service';
import { VisitorCountService } from './visitor-count.service';
import { AccessService } from './access.service';
import { classify } from './failure';
import {
  Draft,
  EMPTY_DRAFT,
  InterestKey,
  LoadFailure,
  VisitorSubmission,
} from '@shared/models/types';
import { OTHER_REASON, THANKS_SCREEN_MS } from '@shared/constants';

export type Step = 'start' | 'form' | 'review' | 'done';

/** The five steps of the form, in order, with the name shown in the step bar. */
export const FORM_STEPS = [
  { id: 'place', label: 'Wohnort' },
  { id: 'about', label: 'Über dich' },
  { id: 'source', label: 'Erfahren' },
  { id: 'interests', label: 'Interessen' },
  { id: 'photo', label: 'Foto' },
] as const;

export type FormStep = (typeof FORM_STEPS)[number]['id'];

export interface SaveError {
  /** 'login': the session ended (401); 'denied': the access was taken away (403). */
  kind: LoadFailure | 'login' | 'denied';
  status?: number;
}

/** The registration of the visitor currently at the tablet, from start to done. */
@Injectable({
  providedIn: 'root',
})
export class RegistrationSessionService {
  private api = inject(RegistrationApiService);
  private reference = inject(ReferenceDataService);
  private counter = inject(VisitorCountService);
  private access = inject(AccessService);
  private thanksTimer: ReturnType<typeof setTimeout> | undefined;

  readonly step = signal<Step>('start');
  /** "Anmeldung starten" is checking the school login. */
  readonly starting = signal(false);
  /** The login ends too soon for a registration: log in again first. */
  readonly renewLogin = signal(false);
  readonly formIndex = signal(0);
  readonly draft = signal<Draft>(EMPTY_DRAFT);
  /** True after tapping a row in the overview, until the overview is back. */
  readonly editing = signal(false);

  readonly saving = signal(false);
  readonly saveError = signal<SaveError | null>(null);
  /** The id the backend gave the saved visitor: the number for the licence. */
  readonly savedId = signal<number | null>(null);
  readonly savedWithPhoto = signal(false);

  readonly formStep = computed<FormStep>(() => FORM_STEPS[this.formIndex()].id);
  readonly isFirst = computed(() => this.formIndex() === 0);

  readonly city = computed(() => this.reference.city(this.draft().cityId));

  /** Whether a step has everything it needs; Interessen is optional. */
  readonly complete = computed<Record<FormStep, boolean>>(() => {
    const d = this.draft();
    return {
      place: d.cityId !== null,
      about:
        d.gender !== null &&
        d.schoolLevel !== null &&
        d.schoolType !== null &&
        d.adults !== null,
      source: d.reason !== null,
      interests: true,
      photo: d.usePhoto === false || (d.usePhoto === true && d.photo !== null),
    };
  });

  readonly canContinue = computed(() => this.complete()[this.formStep()]);

  readonly submission = computed<VisitorSubmission | null>(() => {
    const d = this.draft();
    if (
      d.cityId === null ||
      d.gender === null ||
      d.schoolLevel === null ||
      d.schoolType === null ||
      d.adults === null ||
      d.reason === null ||
      d.usePhoto === null ||
      (d.usePhoto && d.photo === null)
    ) {
      return null;
    }
    const comment = d.comment.trim();
    const has = (key: InterestKey) => d.interests.includes(key);
    return {
      cityId: d.cityId,
      gender: d.gender,
      adults: d.adults,
      schoolLevel: d.schoolLevel,
      schoolType: d.schoolType,
      reasonForVisit: d.reason,
      comment: d.reason === OTHER_REASON && comment !== '' ? comment : null,
      interestedInInformatik: has('interestedInInformatik'),
      interestedInMedientechnik: has('interestedInMedientechnik'),
      interestedInElektronik: has('interestedInElektronik'),
      interestedInMedizintechnik: has('interestedInMedizintechnik'),
      interestedInFachschuleElektronik: has('interestedInFachschuleElektronik'),
      interestedInAbendschule: has('interestedInAbendschule'),
      interestedInKolleg: has('interestedInKolleg'),
      photo: d.usePhoto ? d.photo : null,
    };
  });

  async start(): Promise<void> {
    if (!this.reference.ready() || this.starting()) return;
    // Logging in again replaces the page, so it has to happen before anything is entered.
    this.starting.set(true);
    try {
      const session = await this.access.sessionLongEnough();
      this.renewLogin.set(session === 'renew');
      if (session === 'renew') return;
    } finally {
      this.starting.set(false);
    }
    this.clear();
    this.step.set('form');
    // A tablet may have waited on the start screen for hours: fetch changes made in the
    // dashboard since then. The form starts at once with the cached lists; the choice lists
    // come in later steps, and a failed load keeps the cache.
    this.reference.load();
  }

  update(changes: Partial<Draft>): void {
    this.draft.update((prev) => ({ ...prev, ...changes }));
  }

  next(): void {
    if (!this.canContinue()) return;
    if (this.editing() || this.formIndex() === FORM_STEPS.length - 1) {
      this.toReview();
    } else {
      this.formIndex.update((i) => i + 1);
    }
  }

  back(): void {
    if (this.step() === 'review') {
      this.formIndex.set(FORM_STEPS.length - 1);
      this.step.set('form');
    } else if (!this.isFirst()) {
      this.editing.set(false);
      this.formIndex.update((i) => i - 1);
    }
  }

  /** Opens one step from the overview; "Zur Übersicht" then returns to it. */
  edit(step: FormStep): void {
    this.editing.set(true);
    this.formIndex.set(FORM_STEPS.findIndex((s) => s.id === step));
    this.saveError.set(null);
    this.step.set('form');
  }

  private toReview(): void {
    this.editing.set(false);
    this.step.set('review');
  }

  async save(): Promise<void> {
    const visitor = this.submission();
    if (!visitor || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const id = await this.api.addVisitor(visitor);
      this.savedId.set(id);
      this.savedWithPhoto.set(visitor.photo !== null);
      this.step.set('done');
      this.counter.refresh();
      // The licence number has to be noted down, so that screen waits for a tap.
      if (visitor.photo === null) {
        this.thanksTimer = setTimeout(() => this.reset(), THANKS_SCREEN_MS);
      }
    } catch (err) {
      console.warn('Registration could not be saved', err);
      const status = err instanceof HttpErrorResponse ? err.status : undefined;
      this.saveError.set({
        kind:
          status === 401 ? 'login' : status === 403 ? 'denied' : classify(err),
        status,
      });
    } finally {
      this.saving.set(false);
    }
  }

  /** Discards the running registration and gets the tablet ready for the next visitor. */
  reset(): void {
    this.clear();
    this.step.set('start');
    this.reference.load();
  }

  private clear(): void {
    clearTimeout(this.thanksTimer);
    this.draft.set(EMPTY_DRAFT);
    this.formIndex.set(0);
    this.editing.set(false);
    this.saving.set(false);
    this.saveError.set(null);
    this.savedId.set(null);
    this.savedWithPhoto.set(false);
  }
}
