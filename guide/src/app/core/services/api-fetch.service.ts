import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Division,
  FeatureFlag,
  FeedbackQuestion,
  FeedbackSubmission,
  Stop,
  StopGroup,
} from '@shared/models/types';
import { BASE_URL } from '@app/app.config';
import { LAST_KNOWN_PREFIX } from '@shared/constants/constants';

@Injectable({
  providedIn: 'root',
})
export class ApiFetchService {
  private http = inject(HttpClient);
  private baseURL = inject(BASE_URL);

  public async getShowCountdown(): Promise<FeatureFlag> {
    return firstValueFrom(
      this.http.get<FeatureFlag>(
        this.baseURL + '/v1/featureflags/showCountdown'
      )
    );
  }

  public async getDivisions(): Promise<Division[]> {
    return this.getWithLastKnown<Division[]>('/v1/divisions');
  }

  public async getStopGroups(): Promise<StopGroup[]> {
    return this.getWithLastKnown<StopGroup[]>('/v1/groups');
  }

  public async getStops(): Promise<Stop[]> {
    return this.getWithLastKnown<Stop[]>('/v1/stops');
  }

  public async getStopsOfGroup(groupID: number): Promise<Stop[]> {
    return (await this.getStops()).filter((stop) =>
      stop.stopGroupIds.includes(groupID)
    );
  }

  public async getAllFeedbackQuestions(): Promise<FeedbackQuestion[]> {
    return this.getWithLastKnown<FeedbackQuestion[]>('/v1/feedback-questions');
  }

  public async submitFeedback(feedbackSubmissions: FeedbackSubmission[]) {
    await firstValueFrom(
      this.http.post(this.baseURL + '/v1/add-feedbacks', feedbackSubmissions, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  }

  /**
   * The school Wi-Fi is crowded on the open day: keep the last answer of each read in this
   * browser and fall back to it when the request fails. Only throws when there is none yet.
   */
  private async getWithLastKnown<T>(path: string): Promise<T> {
    const key = LAST_KNOWN_PREFIX + path;
    try {
      const value = await firstValueFrom(this.http.get<T>(this.baseURL + path));
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Storage full or blocked: the fresh answer is still good.
      }
      return value;
    } catch (error) {
      const stored = localStorage.getItem(key);
      if (stored === null) {
        throw error;
      }
      return JSON.parse(stored) as T;
    }
  }
}
