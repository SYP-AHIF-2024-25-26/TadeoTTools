import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Info } from '@/shared/models/types';

// App-wide notifications, rendered once by the app shell.
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Info[]>([]);

  success(message: string, action?: Info['action']) {
    this.add('info', message, action);
  }

  error(message: string) {
    this.add('error', message);
  }

  dismiss(id: number) {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private add(type: Info['type'], message: string, action?: Info['action']) {
    const info: Info = { id: this.nextId++, type, message, action };
    this.toasts.update((toasts) => [...toasts, info]);
  }
}

// The backend answers failed requests with a plain string or ProblemDetails.
export function errorText(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'The server could not be reached. Check your connection and try again.';
    }
    const body = error.error;
    if (typeof body === 'string' && body.trim() !== '') {
      return body;
    }
    if (body && typeof body === 'object') {
      const { detail, title } = body as { detail?: unknown; title?: unknown };
      if (typeof detail === 'string' && detail !== '') return detail;
      if (typeof title === 'string' && title !== '') return title;
    }
  }
  return fallback;
}
