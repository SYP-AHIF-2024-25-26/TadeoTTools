import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {FeedbackQuestion} from "./pages/feedback-configurator/feedback-configurator.component";
import {firstValueFrom} from "rxjs";
import {BASE_URL} from "./app.config";

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);

  async getAllFeedbackQuestions(): Promise<FeedbackQuestion[]> {
    return await firstValueFrom(this.httpClient.get<FeedbackQuestion[]>('http://localhost:5000/v1/feedback-questions'));
  }

  async saveFeedbackQuestions(questions: FeedbackQuestion[]) {
    await firstValueFrom(this.httpClient.post<FeedbackQuestion[]>('http://localhost:5000/v1/save-questions', questions));
  }
}
