import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackApiService } from './feedback-api.service';
import { FeedbackQuestion } from '@shared/models/types';
import { QUESTIONS_CACHE_KEY, QUESTIONS_RETRY_MS } from '@shared/constants';

/** Why the last attempt to load the questions failed. */
export type LoadFailure = 'no-network' | 'server';

/**
 * The questionnaire. Loaded from the backend whenever possible and kept in
 * localStorage, so the tablet keeps working when the Wi-Fi drops.
 */
@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private api = inject(FeedbackApiService);
  private running: Promise<void> | undefined;

  readonly questions = signal<FeedbackQuestion[]>(this.readCache());
  /** True while a request for the questions is running. */
  readonly loading = signal(false);
  /** Set when the last attempt failed; the cached questions (if any) are in use. */
  readonly failure = signal<LoadFailure | null>(null);
  /** When the last attempt finished, successful or not. */
  readonly lastAttempt = signal<Date | null>(null);

  constructor() {
    // A tablet without any questions cannot be used at all, so it keeps trying
    // by itself. With questions on screen nothing is reloaded behind the
    // visitor's back; the session reloads them between two visitors.
    window.addEventListener('online', () => {
      if (this.questions().length === 0) this.load();
    });
    setInterval(() => {
      if (this.questions().length === 0) this.load();
    }, QUESTIONS_RETRY_MS);
  }

  /** Refreshes the questions; keeps the cached ones if the backend is not reachable. */
  load(): Promise<void> {
    this.running ??= this.fetch().finally(() => (this.running = undefined));
    return this.running;
  }

  private async fetch(): Promise<void> {
    this.loading.set(true);
    try {
      const questions = await this.api.getQuestions();
      this.questions.set(questions);
      this.failure.set(null);
      writeCache(questions);
    } catch (err) {
      console.warn('Feedback questions could not be loaded, using cache', err);
      this.failure.set(classify(err));
    } finally {
      this.loading.set(false);
      this.lastAttempt.set(new Date());
    }
  }

  private readCache(): FeedbackQuestion[] {
    try {
      const cached = localStorage.getItem(QUESTIONS_CACHE_KEY);
      return cached ? (JSON.parse(cached) as FeedbackQuestion[]) : [];
    } catch {
      return [];
    }
  }
}

function writeCache(questions: FeedbackQuestion[]): void {
  try {
    localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(questions));
  } catch (err) {
    // Storage full or blocked: the questions still work until the next reload.
    console.warn('Feedback questions could not be cached', err);
  }
}

/** Status 0 or a timeout means the backend was never reached. */
function classify(err: unknown): LoadFailure {
  if (!navigator.onLine) return 'no-network';
  if (err instanceof HttpErrorResponse && err.status !== 0) return 'server';
  return 'no-network';
}
