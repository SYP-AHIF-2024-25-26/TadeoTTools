import {
  Component,
  computed,
  inject,
  type OnInit,
  signal,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { FeedbackQuestion, FeedbackSubmission } from '@shared/models/types';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
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
  currentVisibleIndex = signal<number>(0);
  isSubmitted = signal<boolean>(false);
  answers = signal<Record<number, string>>({});
  showError = signal<boolean>(false);
  showAnswerSummary = signal<boolean>(false);
  questions = signal<FeedbackQuestion[]>([]);
  currentAnswer = signal<string>('');

  // Computed: which questions are visible based on dependencies
  visibleQuestions = computed<FeedbackQuestion[]>(() => {
    const allQuestions = this.questions();
    const answersMap = this.answers();

    return allQuestions.filter((q) => {
      if (!q.dependencies || q.dependencies.length === 0) {
        return true;
      }

      return q.dependencies.every((dep) => {
        const parentQuestion = allQuestions.find(
          (pq) => pq.id === dep.dependsOnQuestionId
        );
        if (!parentQuestion) return false;

        const parentIndex = allQuestions.indexOf(parentQuestion);
        const parentAnswer = answersMap[parentIndex] || '';

        if (parentQuestion.type === 'MultipleChoice') {
          const selectedOptions = parentAnswer
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s);
          return selectedOptions.includes(dep.conditionValue);
        }

        return parentAnswer === dep.conditionValue;
      });
    });
  });

  feedbackAlreadySubmitted = computed(
    () => localStorage.getItem('feedbackSubmitted') === 'true'
  );

  currentQuestion = computed<FeedbackQuestion>(() => {
    const visible = this.visibleQuestions();
    const index = this.currentVisibleIndex();
    return visible[index];
  });

  progressPercentage = computed<number>(() =>
    Math.round(
      (this.currentVisibleIndex() / this.visibleQuestions().length) * 100
    )
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
    this.loadCurrentAnswer();
  }

  async loadQuestions(): Promise<void> {
    const fetchedQuestions =
      await this.apiFetchService.getAllFeedbackQuestions();
    this.questions.set(fetchedQuestions);
  }

  private loadCurrentAnswer(): void {
    const question = this.currentQuestion();
    if (!question) return;

    const allQuestions = this.questions();
    const actualIndex = allQuestions.indexOf(question);
    const answersValue = this.answers();

    if (answersValue[actualIndex]) {
      this.currentAnswer.set(answersValue[actualIndex]);
    } else {
      this.currentAnswer.set('');
    }
  }

  private saveCurrentAnswer(): void {
    const question = this.currentQuestion();
    if (!question) return;

    const allQuestions = this.questions();
    const actualIndex = allQuestions.indexOf(question);

    this.answers.update((prev) => ({
      ...prev,
      [actualIndex]: this.currentAnswer(),
    }));
  }

  async onSubmit(): Promise<void> {
    this.showError.set(false);

    if (!this.isAnswerValid()) {
      this.showError.set(true);
      return;
    }

    this.saveCurrentAnswer();

    const visible = this.visibleQuestions();
    const currentIndex = this.currentVisibleIndex();

    if (currentIndex < visible.length - 1) {
      this.currentVisibleIndex.set(currentIndex + 1);
      this.loadCurrentAnswer();
    } else {
      this.isSubmitted.set(true);
      const answersValue = this.answers();
      const allQuestions = this.questions();

      // Only submit answers for visible questions
      const submissions = visible
        .map((question) => {
          const actualIndex = allQuestions.indexOf(question);
          return {
            questionId: question.id,
            answer: answersValue[actualIndex] || '',
          } as FeedbackSubmission;
        })
        .filter((s) => s.questionId !== undefined);

      await this.apiFetchService.submitFeedback(submissions);
      localStorage.setItem('feedbackSubmitted', 'true');
    }
  }

  goToPrevious(): void {
    const currentIndex = this.currentVisibleIndex();
    if (currentIndex > 0) {
      this.saveCurrentAnswer();
      this.currentVisibleIndex.set(currentIndex - 1);
      this.loadCurrentAnswer();
      this.showError.set(false);
    }
  }

  selectOption(option: string): void {
    const question = this.currentQuestion();
    if (!question) return;

    if (question.type === 'MultipleChoice') {
      const currentAnswer = this.currentAnswer();
      const selectedOptions = currentAnswer
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);

      if (selectedOptions.includes(option)) {
        const newOptions = selectedOptions.filter((o) => o !== option);
        this.currentAnswer.set(newOptions.join(', '));
      } else {
        selectedOptions.push(option);
        this.currentAnswer.set(selectedOptions.join(', '));
      }
    } else {
      this.currentAnswer.set(option);
    }
  }

  isOptionSelected(option: string): boolean {
    const question = this.currentQuestion();
    if (!question) return false;

    if (question.type === 'MultipleChoice') {
      const currentAnswer = this.currentAnswer();
      const selectedOptions = currentAnswer
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      return selectedOptions.includes(option);
    }

    return this.currentAnswer() === option;
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
