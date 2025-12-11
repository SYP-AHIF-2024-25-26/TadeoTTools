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
  type: 'text' | 'choice' | 'rating';
  required: boolean;
  placeholder?: string;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  ratingLabels?: string;
  order: number;
};

export type FeedbackSubmission = {
  questionId: number;
  answer: string;
};
