import { inject, Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { FeedbackQuestion } from "./pages/feedback-configurator/feedback-configurator.component";
import { firstValueFrom } from "rxjs";
import { BASE_URL } from "./app.config";

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  getAllFeedbackQuestions(): Promise<FeedbackQuestion[]> {
    return firstValueFrom(
      this.httpClient.get<FeedbackQuestion[]>(`${this.baseUrl}/feedback-questions`)
    );
  }

  saveFeedbackQuestions(questions: FeedbackQuestion[]): Promise<void> {
    return firstValueFrom(
      this.httpClient.post<void>(`${this.baseUrl}/save-questions`, questions)
    );
  }

  getFeedbackQuestionAnswersFile(): Promise<Blob> {
    return firstValueFrom(
      this.httpClient.get(`${this.baseUrl}/get-answers-csv`, {
        responseType: 'blob'
      })
    );
  }
}
