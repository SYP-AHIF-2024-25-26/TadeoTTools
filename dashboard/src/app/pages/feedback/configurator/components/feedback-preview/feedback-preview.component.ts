import {
  Component,
  computed,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ToastService } from '@/core/services/toast.service';
import { FeedbackQuestion } from '@/shared/models/types';

@Component({
  selector: 'app-feedback-preview',
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './feedback-preview.component.html',
})
export class FeedbackPreviewComponent {
  private toast = inject(ToastService);

  readonly questions = input.required<FeedbackQuestion[]>();

  readonly previewQuestionIndex = signal(0);
  readonly previewAnswers = signal<Record<number, string>>({});

  // Computed: which questions are visible based on dependencies. Conditions on the
  // same parent question are joined with OR, conditions on different parents with AND;
  // a parent that is itself hidden never satisfies a condition.
  readonly visibleQuestions = computed(() => {
    const allQuestions = this.questions();
    const answers = this.previewAnswers();
    const visible = new Set<FeedbackQuestion>();

    allQuestions.forEach((q) => {
      const valuesByParent = new Map<number, string[]>();
      for (const dep of q.dependencies ?? []) {
        const values = valuesByParent.get(dep.dependsOnQuestionId) ?? [];
        values.push(dep.conditionValue);
        valuesByParent.set(dep.dependsOnQuestionId, values);
      }

      const shown = [...valuesByParent].every(([parentId, values]) => {
        const parentQuestion = allQuestions.find((pq) => pq.id === parentId);
        if (!parentQuestion || !visible.has(parentQuestion)) return false;

        const parentIndex = allQuestions.indexOf(parentQuestion);
        const parentAnswer = answers[parentIndex] || '';

        // For MultipleChoice, the answer is the chosen options joined with ", "
        if (parentQuestion.type === 'MultipleChoice') {
          const selectedOptions = parentAnswer
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s);
          return values.some((v) => selectedOptions.includes(v));
        }

        // SingleChoice and Rating: direct comparison
        return values.includes(parentAnswer);
      });
      if (shown) visible.add(q);
    });

    return allQuestions.filter((q) => visible.has(q));
  });

  readonly currentPreviewQuestion = computed(() => {
    const visible = this.visibleQuestions();
    const index = this.previewQuestionIndex();
    return visible.length > 0 && index < visible.length
      ? visible[index]
      : undefined;
  });

  readonly currentPreviewAnswer = computed(() => {
    const question = this.currentPreviewQuestion();
    if (!question) return '';
    const allQuestions = this.questions();
    const actualIndex = allQuestions.indexOf(question);
    return this.previewAnswers()[actualIndex] || '';
  });

  readonly previewProgressPercentage = computed(() => {
    const total = this.visibleQuestions().length;
    return total > 0
      ? Math.round((this.previewQuestionIndex() / total) * 100)
      : 0;
  });

  nextPreviewQuestion(): void {
    const currentIndex = this.previewQuestionIndex();
    const visible = this.visibleQuestions();

    if (currentIndex < visible.length - 1) {
      this.previewQuestionIndex.set(currentIndex + 1);
    } else {
      this.toast.success(
        'Preview finished. In the visitor app, the answers would be submitted now.'
      );
      this.previewQuestionIndex.set(0);
      this.previewAnswers.set({});
    }
  }

  previousPreviewQuestion(): void {
    const currentIndex = this.previewQuestionIndex();
    if (currentIndex > 0) {
      this.previewQuestionIndex.set(currentIndex - 1);
    }
  }

  updatePreviewAnswer(value: string): void {
    const question = this.currentPreviewQuestion();
    if (!question) return;
    const allQuestions = this.questions();
    const actualIndex = allQuestions.indexOf(question);

    this.previewAnswers.update((answers) => ({
      ...answers,
      [actualIndex]: value,
    }));
  }

  selectPreviewOption(option: string): void {
    const question = this.currentPreviewQuestion();
    if (!question) return;

    if (question.type === 'MultipleChoice') {
      // Toggle option in comma-separated list
      const currentAnswer = this.currentPreviewAnswer();
      const selectedOptions = currentAnswer
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);

      if (selectedOptions.includes(option)) {
        // Remove option
        const newOptions = selectedOptions.filter((o) => o !== option);
        this.updatePreviewAnswer(newOptions.join(', '));
      } else {
        // Add option
        selectedOptions.push(option);
        this.updatePreviewAnswer(selectedOptions.join(', '));
      }
    } else {
      // SingleChoice - just set the value
      this.updatePreviewAnswer(option);
    }
  }

  isOptionSelected(option: string): boolean {
    const question = this.currentPreviewQuestion();
    if (!question) return false;

    if (question.type === 'MultipleChoice') {
      const currentAnswer = this.currentPreviewAnswer();
      const selectedOptions = currentAnswer
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      return selectedOptions.includes(option);
    }

    return this.currentPreviewAnswer() === option;
  }

  selectPreviewRating(rating: number): void {
    this.updatePreviewAnswer(rating.toString());
  }

  getPreviewRatingRange(): number[] {
    const question = this.currentPreviewQuestion();
    if (!question) return [1, 2, 3, 4, 5];

    const min = question.minRating ?? 1;
    const max = question.maxRating ?? 5;
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  getPreviewRatingLabel(rating: number): string {
    const question = this.currentPreviewQuestion();
    if (!question?.ratingLabels) return rating.toString();

    const labels = question.ratingLabels
      .split(',')
      .map((label) => label.trim());
    const min = question.minRating ?? 1;
    const index = rating - min;

    return index >= 0 && index < labels.length
      ? labels[index]
      : rating.toString();
  }
}
