import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {FeedbackQuestion} from "./pages/feedback-configurator/feedback-configurator.component";
import {firstValueFrom} from "rxjs";
import {BASE_URL} from "./app.config";
import { Info } from './types';
import { InfoStore } from './store/info.store';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  private httpClient = inject(HttpClient);
  private baseUrl = inject(BASE_URL);
  private readonly infoStore = inject(InfoStore);

  async getAllFeedbackQuestions(): Promise<FeedbackQuestion[]> {
    try {
      return await firstValueFrom(this.httpClient.get<FeedbackQuestion[]>(this.baseUrl + '/feedback-questions'));
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to get feedback questions' });
      throw error;
    }
  }

  async saveFeedbackQuestions(questions: FeedbackQuestion[]) {
    try {
      await firstValueFrom(this.httpClient.post<FeedbackQuestion[]>(this.baseUrl + '/save-questions', questions));
      this.infoStore.addInfo({ id: 0, type: 'info', message: 'Successfully saved feedback questions' });
    } catch (error) {
      this.infoStore.addInfo({ id: 0, type: 'error', message: 'Failed to save feedback questions' });
      throw error;
    }
  }

  getFeedbackQuestionAnswersFile(): Promise<Blob> {
    return firstValueFrom(this.httpClient.get(this.baseUrl + '/get-answers-csv', {
      responseType: 'blob'
    }));
  }
}
