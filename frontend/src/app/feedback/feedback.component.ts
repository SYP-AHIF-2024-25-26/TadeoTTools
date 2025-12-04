import {
  Component,
  computed,
  inject,
  type OnInit,
  signal,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { FeedbackQuestion, FeedbackSubmission } from '../types';
import { ApiFetchService } from '../api-fetch.service';
import { HeaderComponent } from '../header/header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-feedback',
  imports: [HeaderComponent, NavbarComponent],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackComponent implements OnInit {
  // State signals
  currentQuestionIndex = signal<number>(0);
  isSubmitted = signal<boolean>(false);
  answers = signal<Record<number, string>>({});
  showError = signal<boolean>(false);
  showAnswerSummary = signal<boolean>(false);
  questions = signal<FeedbackQuestion[]>([]);
  currentAnswer = signal<string>('');

  // Computed signals
  feedbackAlreadySubmitted = computed(
    () => localStorage.getItem('feedbackSubmitted') === 'true'
  );
  currentQuestion = computed<FeedbackQuestion>(
    () => this.questions()[this.currentQuestionIndex()]
  );
  progressPercentage = computed<number>(() =>
    Math.round((this.currentQuestionIndex() / this.questions().length) * 100)
  );
  isAnswerValid = computed<boolean>(() => {
    const question = this.currentQuestion();
    const answer = this.currentAnswer();
    return (
      !question?.required ||
      (answer !== null && answer !== undefined && answer.trim() !== '')
    );
  });

  private apiFetchService = inject(ApiFetchService);
  private router = inject(Router);

  @HostListener('swipeleft')
  onSwipeLeft() {
    this.router.navigate(['/about']);
  }

  @HostListener('swiperight')
  onSwipeRight() {
    this.router.navigate(['/map']);
  }

  async ngOnInit(): Promise<void> {
    await this.loadQuestions();

    // Initialize current answer from saved answers
    const answersValue = this.answers();
    if (answersValue[this.currentQuestionIndex()]) {
      this.currentAnswer.set(answersValue[this.currentQuestionIndex()]);
    }
  }

  async loadQuestions(): Promise<void> {
    const fetchedQuestions =
      await this.apiFetchService.getAllFeedbackQuestions();
    this.questions.set(fetchedQuestions);
  }

  async onSubmit(): Promise<void> {
    this.showError.set(false);

    // Validate answer
    if (!this.isAnswerValid()) {
      this.showError.set(true);
      return;
    }

    // Save the current answer
    const currentIndex = this.currentQuestionIndex();
    this.answers.update((prev) => ({
      ...prev,
      [currentIndex]: this.currentAnswer(),
    }));

    if (currentIndex < this.questions().length - 1) {
      // Move to next question
      this.currentQuestionIndex.set(currentIndex + 1);

      // Load saved answer for next question or clear
      const answersValue = this.answers();
      this.currentAnswer.set(answersValue[this.currentQuestionIndex()] || '');
    } else {
      // Submit all answers
      this.isSubmitted.set(true);
      const answersValue = this.answers();
      await this.apiFetchService.submitFeedback(
        this.questions().map(
          (question, index) =>
            ({
              questionId: question.id,
              answer: answersValue[index] || '',
            }) as FeedbackSubmission
        )
      );

      localStorage.setItem('feedbackSubmitted', 'true');
    }
  }

  goToPrevious(): void {
    const currentIndex = this.currentQuestionIndex();
    if (currentIndex > 0) {
      // Save current answer before going back
      this.answers.update((prev) => ({
        ...prev,
        [currentIndex]: this.currentAnswer(),
      }));

      // Go to previous question
      this.currentQuestionIndex.set(currentIndex - 1);

      // Load saved answer for previous question
      const answersValue = this.answers();
      this.currentAnswer.set(answersValue[this.currentQuestionIndex()] || '');

      this.showError.set(false);
    }
  }

  // Helper methods for different question types
  selectOption(option: string): void {
    this.currentAnswer.set(option);
  }

  selectRating(rating: number): void {
    this.currentAnswer.set(rating.toString());
  }

  updateTextAnswer(value: string): void {
    this.currentAnswer.set(value);
  }

  getRatingRange(): number[] {
    const currentQuestionValue = this.currentQuestion();
    const min = currentQuestionValue.minRating || 1;
    const max = currentQuestionValue.maxRating || 5;
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  }

  getRatingLabel(rating: number): string {
    const currentQuestionValue = this.currentQuestion();
    if (!currentQuestionValue.ratingLabels) return rating.toString();

    const labels = currentQuestionValue.ratingLabels
      .split(',')
      .map((label) => label.trim());
    const min = currentQuestionValue.minRating || 1;
    const index = rating - min;

    if (index >= 0 && index < labels.length) {
      return labels[index];
    }

    return rating.toString();
  }
}
