import { Component, computed, input, signal } from '@angular/core';
import { FeedbackQuestion } from '@/shared/models/types';

@Component({
  selector: 'app-feedback-preview',
  standalone: true,
  templateUrl: './feedback-preview.component.html',
})
export class FeedbackPreviewComponent {
  readonly questions = input.required<FeedbackQuestion[]>();
  readonly formTitle = input.required<string>();
  readonly formSubtitle = input.required<string>();

  readonly previewQuestionIndex = signal(0);
  readonly previewAnswers = signal<Record<number, string>>({});

  // Computed: which questions are visible based on dependencies
  readonly visibleQuestions = computed(() => {
    const allQuestions = this.questions();
    const answers = this.previewAnswers();

    return allQuestions.filter((q, index) => {
      if (!q.dependencies || q.dependencies.length === 0) {
        return true; // No dependencies, always visible
      }

      // Check if all dependencies are satisfied
      return q.dependencies.every((dep) => {
        const parentQuestion = allQuestions.find(
          (pq) => pq.id === dep.dependsOnQuestionId
        );
        if (!parentQuestion) return false;

        const parentIndex = allQuestions.indexOf(parentQuestion);
        const parentAnswer = answers[parentIndex] || '';

        // For MultipleChoice, check if the condition value is in the comma-separated answer
        if (parentQuestion.type === 'MultipleChoice') {
          const selectedOptions = parentAnswer
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s);
          return selectedOptions.includes(dep.conditionValue);
        }

        // For SingleChoice, direct comparison
        return parentAnswer === dep.conditionValue;
      });
    });
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
      alert(
        'Form preview completed! In the real form, this would submit the answers.'
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
