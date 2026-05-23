export interface QA {
  question: string;
  answer: string;
}

export interface FeedbackResult {
  summaryRating: number;
  overallFeedback: string;
  questionReviews: {
    question: string;
    userAnswer: string;
    feedback: string;
    suggestionsForImprovement: string;
  }[];
}

export interface SessionRecord {
  id: string;
  date: string;
  role: string;
  type: string;
  score: number;
  summary: string;
  history: QA[];
  feedbackResult?: FeedbackResult;
  resume?: string;
  jobDescription?: string;
}

export type AppState = 'dashboard' | 'preparation' | 'interview' | 'feedback' | 'areas' | 'settings';
