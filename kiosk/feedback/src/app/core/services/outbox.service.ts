import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FeedbackApiService } from './feedback-api.service';
import { FeedbackSubmission, PendingFeedback } from '@shared/models/types';
import { OUTBOX_KEY, OUTBOX_RETRY_MS } from '@shared/constants';

/**
 * Finished feedback is written here first and then sent. Whatever cannot be sent
 * stays in localStorage and is retried when the tablet is back online, so no
 * visitor's feedback is lost to a Wi-Fi gap at the building exit.
 */
@Injectable({
  providedIn: 'root',
})
export class OutboxService {
  private api = inject(FeedbackApiService);
  readonly pending = signal<PendingFeedback[]>(this.read());
  /** True while pending feedback is being sent. */
  readonly sending = signal(false);

  constructor() {
    window.addEventListener('online', () => this.flush());
    setInterval(() => {
      if (this.pending().length > 0) this.flush();
    }, OUTBOX_RETRY_MS);
  }

  add(answers: FeedbackSubmission[]): void {
    const entry: PendingFeedback = {
      // crypto.randomUUID() needs a secure context, which a LAN test setup may lack.
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      answers,
    };
    this.write([...this.pending(), entry]);
    this.flush();
  }

  /** Sends the pending feedback oldest first; stops at the first network failure. */
  async flush(): Promise<void> {
    if (this.sending()) return;
    this.sending.set(true);
    try {
      for (const entry of this.pending()) {
        try {
          await this.api.submit(entry.answers);
        } catch (err) {
          if (!isRejected(err)) return;
          // The backend refused it (e.g. an admin deleted a question in the
          // meantime). Retrying would fail forever, so it is dropped.
          console.error(
            'Feedback rejected by the backend, dropped',
            entry,
            err
          );
        }
        this.write(this.pending().filter((e) => e.id !== entry.id));
      }
    } finally {
      this.sending.set(false);
    }
  }

  private read(): PendingFeedback[] {
    try {
      const stored = localStorage.getItem(OUTBOX_KEY);
      return stored ? (JSON.parse(stored) as PendingFeedback[]) : [];
    } catch {
      return [];
    }
  }

  private write(entries: PendingFeedback[]): void {
    this.pending.set(entries);
    try {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
    } catch (err) {
      // Storage full or blocked: the entries stay in memory and are still sent,
      // they only would not survive a reload.
      console.error('Feedback outbox could not be stored', err);
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
