import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { FeedbackSubmission } from '@shared/models/types';
import { FEEDBACK_OUTBOX } from '@shared/constants/constants';

interface PendingFeedback {
  id: string;
  answers: FeedbackSubmission[];
}

const RETRY_MS = 30000;

/**
 * Finished feedback is written here first and then sent. Whatever cannot be sent stays
 * in localStorage and is retried when the phone is back online or the app is opened
 * again, so the crowded school Wi-Fi never loses a visitor's feedback.
 */
@Injectable({
  providedIn: 'root',
})
export class FeedbackOutboxService {
  private api = inject(ApiFetchService);
  readonly pending = signal<PendingFeedback[]>(this.read());
  private sending = false;

  constructor() {
    window.addEventListener('online', () => this.flush());
    setInterval(() => {
      if (this.pending().length > 0) this.flush();
    }, RETRY_MS);
    this.flush();
  }

  add(answers: FeedbackSubmission[]): void {
    const entry: PendingFeedback = {
      // crypto.randomUUID() needs a secure context, which a LAN test setup may lack.
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      answers,
    };
    this.write([...this.pending(), entry]);
    this.flush();
  }

  /** Sends the pending feedback oldest first; stops at the first network failure. */
  async flush(): Promise<void> {
    if (this.sending) return;
    this.sending = true;
    try {
      for (const entry of this.pending()) {
        try {
          await this.api.submitFeedback(entry.answers);
        } catch (err) {
          if (!isRejected(err)) return;
          // The backend refused it (e.g. an admin deleted a question in the meantime).
          // Retrying would fail forever, so it is dropped.
          console.error('Feedback rejected by the backend, dropped', err);
        }
        this.write(this.pending().filter((e) => e.id !== entry.id));
      }
    } finally {
      this.sending = false;
    }
  }

  private read(): PendingFeedback[] {
    try {
      const stored = localStorage.getItem(FEEDBACK_OUTBOX);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? (parsed as PendingFeedback[]) : [];
    } catch {
      return [];
    }
  }

  private write(entries: PendingFeedback[]): void {
    this.pending.set(entries);
    try {
      localStorage.setItem(FEEDBACK_OUTBOX, JSON.stringify(entries));
    } catch {
      // Storage full or blocked: the entries stay in memory and are still sent.
    }
  }
}

function isRejected(err: unknown): boolean {
  // 400: validation (e.g. unknown question id), 409: database constraint.
  return (
    err instanceof HttpErrorResponse &&
    (err.status === 400 || err.status === 409)
  );
}
