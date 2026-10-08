import { AnswerMap, FeedbackQuestion } from './types';

// The backend stores multiple choice answers as the chosen options joined with ", "
// (see FeedbackManagementEndpoints.GetFeedbackResponses), like the GuideApp sends them.
const MULTIPLE_SEPARATOR = ', ';

export function splitMultiple(answer: string | undefined): string[] {
  return (answer ?? '')
    .split(MULTIPLE_SEPARATOR)
    .map((s) => s.trim())
    .filter((s) => s);
}

export function toggleMultiple(answer: string | undefined, option: string) {
  const chosen = splitMultiple(answer);
  const next = chosen.includes(option)
    ? chosen.filter((o) => o !== option)
    : [...chosen, option];
  return next.join(MULTIPLE_SEPARATOR);
}

export function isAnswered(answer: string | undefined): boolean {
  return (answer ?? '').trim() !== '';
}

/**
 * Questions shown for the given answers, in questionnaire order. A question with
 * dependencies is shown only if every parent question is shown and was answered
 * with the condition value, so answers to hidden questions never count.
 */
export function visibleQuestions(
  questions: FeedbackQuestion[],
  answers: AnswerMap
): FeedbackQuestion[] {
  const visibleIds = new Set<number>();
  const byId = new Map(questions.map((q) => [q.id, q]));

  for (const question of questions) {
    const shown = question.dependencies.every((dep) => {
      const parent = byId.get(dep.dependsOnQuestionId);
      if (!parent || !visibleIds.has(parent.id)) return false;
      const answer = answers[parent.id];
      return parent.type === 'MultipleChoice'
        ? splitMultiple(answer).includes(dep.conditionValue)
        : answer === dep.conditionValue;
    });
    if (shown) visibleIds.add(question.id);
  }

  return questions.filter((q) => visibleIds.has(q.id));
}

/** Rating values from min to max, each with its label if the admin set one. */
export function ratingScale(
  question: FeedbackQuestion
): { value: number; label: string | null }[] {
  const min = question.minRating ?? 1;
  const max = question.maxRating ?? 5;
  const labels = (question.ratingLabels ?? '').split(',').map((l) => l.trim());
  return Array.from({ length: max - min + 1 }, (_, i) => ({
    value: min + i,
    label: labels[i] || null,
  }));
}
