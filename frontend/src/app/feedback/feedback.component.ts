import { Component, computed, inject, type OnInit, signal } from '@angular/core';
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackQuestion, FeedbackSubmission } from '../types';
import { ApiFetchService } from '../api-fetch.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-feedback',
  imports: [
    ReactiveFormsModule,
    HeaderComponent,
  ],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent implements OnInit{
  feedbackForm!: FormGroup
  currentQuestionIndex = signal<number>(0)
  isSubmitted = signal<boolean>(false)
  answers = signal<Record<number, string>>({})
  showError = signal<boolean>(false)
  showAnswerSummary = signal<boolean>(false) // Set to true if you want to show answers in the thank you screen
  feedbackAlreadySubmitted = computed(() => localStorage.getItem("feedbackSubmitted") === "true")
  questions = signal<FeedbackQuestion[]>([])

  // Computed signals
  currentQuestion = computed<FeedbackQuestion>(() => this.questions()[this.currentQuestionIndex()])
  progressPercentage = computed<number>(() => Math.round((this.currentQuestionIndex() / this.questions().length) * 100))


  private fb: FormBuilder = inject(FormBuilder)
  private apiFetchService = inject(ApiFetchService)

  async ngOnInit(): Promise<void> {
    this.feedbackForm = this.fb.group({
      answer: ["", this.currentQuestion()?.required ? Validators.required : []],
    })
    // Initialize the form with any saved answer for the current question
    const answersValue = this.answers();
    if (answersValue[this.currentQuestionIndex()]) {
      this.feedbackForm.patchValue({
        answer: answersValue[this.currentQuestionIndex()],
      })
    }

    await this.loadQuestions();

    // Update validators based on current question
    this.updateFormValidators()
  }

  async loadQuestions(): Promise<void> {
    // Load questions from a service or local storage
    const fetchedQuestions = await this.apiFetchService.getAllFeedbackQuestions();
    this.questions.set(fetchedQuestions);
    // No need to manually trigger change detection with signals
  }

  updateFormValidators(): void {
    const currentQuestionValue = this.currentQuestion()

    if (currentQuestionValue.required) {
      this.feedbackForm.get("answer")?.setValidators(Validators.required)
    } else {
      this.feedbackForm.get("answer")?.clearValidators()
    }

    this.feedbackForm.get("answer")?.updateValueAndValidity()
  }

  async onSubmit(): Promise<void> {
    this.showError.set(false)

    // Check if answer is required but empty
    if (this.currentQuestion().required && !this.feedbackForm.get("answer")?.value) {
      this.showError.set(true)
      return
    }

    // Save the current answer
    const currentIndex = this.currentQuestionIndex();
    const answersValue = this.answers();
    answersValue[currentIndex] = this.feedbackForm.get("answer")?.value || "";
    this.answers.set(answersValue);

    if (currentIndex < this.questions().length - 1) {
      // Move to next question
      this.currentQuestionIndex.set(currentIndex + 1);

      // Update validators for the new question
      this.updateFormValidators()

      // Set the form value to any previously saved answer for this question
      this.feedbackForm.patchValue({
        answer: answersValue[this.currentQuestionIndex()] || "",
      })
    } else {
      this.isSubmitted.set(true);
      await this.apiFetchService.submitFeedback(this.questions().map((question, index) => ({
        questionId: question.id,
        answer: answersValue[index] || "",
      } as FeedbackSubmission)));

      localStorage.setItem("feedbackSubmitted", "true")
    }
  }

  goToPrevious(): void {
    const currentIndex = this.currentQuestionIndex();
    if (currentIndex > 0) {
      // Save current answer before going back
      const answersValue = this.answers();
      answersValue[currentIndex] = this.feedbackForm.get("answer")?.value || "";
      this.answers.set(answersValue);

      // Go to previous question
      this.currentQuestionIndex.set(currentIndex - 1);

      // Update validators for the new question
      this.updateFormValidators()

      // Set the form value to the saved answer for this question
      this.feedbackForm.patchValue({
        answer: answersValue[this.currentQuestionIndex()] || "",
      })

      this.showError.set(false);
    }
  }
  // Helper methods for different question types

  selectOption(option: string): void {
    this.feedbackForm.patchValue({
      answer: option,
    })
  }

  selectRating(rating: number): void {
    this.feedbackForm.patchValue({
      answer: rating.toString(),
    })
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

    const labels = currentQuestionValue.ratingLabels.split(",").map((label) => label.trim());
    const min = currentQuestionValue.minRating || 1;
    const index = rating - min;

    if (index >= 0 && index < labels.length) {
      return labels[index];
    }

    return rating.toString();
  }

}
