import { AnswerMap, FeedbackQuestion } from './types';

// The backend stores multiple choice answers as the chosen options joined with ", "
// (see FeedbackManagementEndpoints.GetFeedbackResponses), like the GuideApp sends them.
const MULTIPLE_SEPARATOR = ', ';

/**
 * The chosen options of a multiple choice answer. With the question's options
 * given, an option that itself contains ", " is still recognised as one.
 */
export function splitMultiple(
  answer: string | undefined,
  options?: string[] | null
): string[] {
  const raw = answer ?? '';
  if (options?.length) {
    const padded = MULTIPLE_SEPARATOR + raw + MULTIPLE_SEPARATOR;
    return options.filter((o) =>
      padded.includes(MULTIPLE_SEPARATOR + o + MULTIPLE_SEPARATOR)
    );
  }
  return raw
    .split(MULTIPLE_SEPARATOR)
    .map((s) => s.trim())
    .filter((s) => s);
}

/** Adds or removes one option; the result keeps the order of the options. */
export function toggleMultiple(
  answer: string | undefined,
  option: string,
  options?: string[] | null
): string {
  const chosen = new Set(splitMultiple(answer, options));
  if (chosen.has(option)) {
    chosen.delete(option);
  } else {
    chosen.add(option);
  }
  const order = options ?? [...chosen];
  return order.filter((o) => chosen.has(o)).join(MULTIPLE_SEPARATOR);
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
      return meetsCondition(parent, answer, dep.conditionValue);
    });
    if (shown) visibleIds.add(question.id);
  }

  return questions.filter((q) => visibleIds.has(q.id));
}

/**
 * Questions shown now plus those that may still be shown because the answer
 * they depend on is not given yet. Counting these for "Frage x von N" means N
 * can only get smaller while the visitor answers, never jump up.
 */
export function possibleQuestions(
  questions: FeedbackQuestion[],
  answers: AnswerMap
): FeedbackQuestion[] {
  const possibleIds = new Set<number>();
  const byId = new Map(questions.map((q) => [q.id, q]));

  for (const question of questions) {
    const possible = question.dependencies.every((dep) => {
      const parent = byId.get(dep.dependsOnQuestionId);
      if (!parent || !possibleIds.has(parent.id)) return false;
      const answer = answers[parent.id];
      return (
        !isAnswered(answer) ||
        meetsCondition(parent, answer, dep.conditionValue)
      );
    });
    if (possible) possibleIds.add(question.id);
  }

  return questions.filter((q) => possibleIds.has(q.id));
}

function meetsCondition(
  parent: FeedbackQuestion,
  answer: string | undefined,
  conditionValue: string
): boolean {
  return parent.type === 'MultipleChoice'
    ? splitMultiple(answer, parent.options).includes(conditionValue)
    : answer === conditionValue;
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
