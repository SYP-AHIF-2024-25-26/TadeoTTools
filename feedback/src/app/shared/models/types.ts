export type FeedbackQuestionType =
  'Text' | 'Rating' | 'SingleChoice' | 'MultipleChoice';

/** Shape of `GET /v1/feedback-questions`. */
export interface FeedbackQuestion {
  id: number;
  question: string;
  type: FeedbackQuestionType;
  required: boolean;
  placeholder?: string | null;
  options?: string[] | null;
  minRating?: number | null;
  maxRating?: number | null;
  ratingLabels?: string | null;
  order: number;
  dependencies: FeedbackDependency[];
}

export interface FeedbackDependency {
  dependsOnQuestionId: number;
  conditionValue: string;
}

/** One entry of the `POST /v1/add-feedbacks` body. */
export interface FeedbackSubmission {
  questionId: number;
  answer: string;
}

/** A finished feedback that has not reached the backend yet. */
export interface PendingFeedback {
  id: string;
  createdAt: string;
  answers: FeedbackSubmission[];
}

/** Answers of the running feedback, keyed by question id. */
export type AnswerMap = Record<number, string>;
