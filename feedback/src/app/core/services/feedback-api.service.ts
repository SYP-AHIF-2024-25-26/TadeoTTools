import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { BASE_URL } from '@app/app.config';
import {
  Division,
  FeedbackQuestion,
  FeedbackSubmission,
} from '@shared/models/types';

/** Requests give up after this, so a weak Wi-Fi never blocks the tablet. */
const REQUEST_TIMEOUT_MS = 8000;

@Injectable({
  providedIn: 'root',
})
export class FeedbackApiService {
  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getQuestions(): Promise<FeedbackQuestion[]> {
    return firstValueFrom(
      this.http
        .get<FeedbackQuestion[]>(`${this.baseUrl}/v1/feedback-questions`)
        .pipe(timeout(REQUEST_TIMEOUT_MS))
    );
  }

  getDivisions(): Promise<Division[]> {
    return firstValueFrom(
      this.http
        .get<Division[]>(`${this.baseUrl}/v1/divisions`)
        .pipe(timeout(REQUEST_TIMEOUT_MS))
    );
  }

  async submit(answers: FeedbackSubmission[]): Promise<void> {
    await firstValueFrom(
      this.http
        .post(`${this.baseUrl}/v1/add-feedbacks`, answers)
        .pipe(timeout(REQUEST_TIMEOUT_MS))
    );
  }
}
