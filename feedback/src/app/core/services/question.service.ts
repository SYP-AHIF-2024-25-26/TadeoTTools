import { inject, Injectable, signal } from '@angular/core';
import { FeedbackApiService } from './feedback-api.service';
import { FeedbackQuestion } from '@shared/models/types';
import { QUESTIONS_CACHE_KEY } from '@shared/constants';

/**
 * The questionnaire. Loaded from the backend whenever possible and kept in
 * localStorage, so the tablet keeps working when the Wi-Fi drops.
 */
@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  private api = inject(FeedbackApiService);

  readonly questions = signal<FeedbackQuestion[]>(this.readCache());
  /** False while the questions come from the cache because the backend was not reachable. */
  readonly isFresh = signal(false);

  /** Refreshes the questions; keeps the cached ones if the backend is not reachable. */
  async load(): Promise<void> {
    try {
      const questions = await this.api.getQuestions();
      this.questions.set(questions);
      this.isFresh.set(true);
      localStorage.setItem(QUESTIONS_CACHE_KEY, JSON.stringify(questions));
    } catch (err) {
      console.warn('Feedback questions could not be loaded, using cache', err);
      this.isFresh.set(false);
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
