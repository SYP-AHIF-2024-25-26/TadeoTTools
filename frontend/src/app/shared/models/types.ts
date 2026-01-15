export type Stop = {
  id: number;
  name: string;
  description: string;
  roomNr: string;
  stopGroupIds: number[];
  divisionIds: number[];
  orders: number[];
};

export type StopGroup = {
  id: number;
  name: string;
  description: string;
  rank: number;
  stopIds: number[];
};

export type Division = {
  id: number;
  name: string;
  color: string;
};

export type FeedbackQuestion = {
  id?: number;
  question: string;
  type: 'Text' | 'Rating' | 'SingleChoice' | 'MultipleChoice';
  required: boolean;
  placeholder?: string;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  ratingLabels?: string;
  order: number;
  dependencies?: FeedbackDependency[];
};

export type FeedbackDependency = {
  dependsOnQuestionId: number;
  conditionValue: string;
};

export type FeedbackSubmission = {
  questionId: number;
  answer: string;
};
