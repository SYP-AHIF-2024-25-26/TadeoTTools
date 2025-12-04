import { Component, computed, input, signal } from '@angular/core';
import { FeedbackQuestion } from '../../../../types';

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

  readonly currentPreviewQuestion = computed(() => {
    const qs = this.questions();
    const index = this.previewQuestionIndex();
    return qs.length > 0 && index < qs.length ? qs[index] : undefined;
  });

  readonly currentPreviewAnswer = computed(
    () => this.previewAnswers()[this.previewQuestionIndex()] || ''
  );

  readonly previewProgressPercentage = computed(() => {
    const total = this.questions().length;
    return total > 0
      ? Math.round((this.previewQuestionIndex() / total) * 100)
      : 0;
  });

  nextPreviewQuestion(): void {
    const currentIndex = this.previewQuestionIndex();
    const currentQuestions = this.questions();

    if (currentIndex < currentQuestions.length - 1) {
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
    this.previewAnswers.update((answers) => ({
      ...answers,
      [this.previewQuestionIndex()]: value,
    }));
  }

  selectPreviewOption(option: string): void {
    this.updatePreviewAnswer(option);
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
