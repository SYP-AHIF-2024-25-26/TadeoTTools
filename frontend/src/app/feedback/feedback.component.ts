import { Component, inject, type OnInit, signal } from '@angular/core';
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { FeedbackQuestion, FeedbackSubmission } from '../types';
import { ApiFetchService } from '../api-fetch.service';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-feedback',
  imports: [
    ReactiveFormsModule,
    NgForOf,
    NgIf,
    HeaderComponent,
  ],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent implements OnInit{
  feedbackForm!: FormGroup
  currentQuestionIndex = 0
  isSubmitted = false
  answers: Record<number, string> = {}
  showError = false
  showAnswerSummary = false // Set to true if you want to show answers in the thank you screen

  questions = signal<FeedbackQuestion[]>([])


  private fb: FormBuilder = inject(FormBuilder)
  private apiFetchService = inject(ApiFetchService)

  async ngOnInit(): Promise<void> {
    this.feedbackForm = this.fb.group({
      answer: ["", this.currentQuestion?.required ? Validators.required : []],
    })
    // Initialize the form with any saved answer for the current question
    if (this.answers[this.currentQuestionIndex]) {
      this.feedbackForm.patchValue({
        answer: this.answers[this.currentQuestionIndex],
      })
    }

    await this.loadQuestions();

    // Update validators based on current question
    this.updateFormValidators()
  }

  get currentQuestion(): FeedbackQuestion {
    return this.questions()[this.currentQuestionIndex]
  }

  get progressPercentage(): number {
    return Math.round((this.currentQuestionIndex / this.questions().length) * 100)
  }

  async loadQuestions(): Promise<void> {
    // Load questions from a service or local storage
    const fetchedQuestions = await this.apiFetchService.getAllFeedbackQuestions();
    this.questions.set(fetchedQuestions);
    // No need to manually trigger change detection with signals
  }

  updateFormValidators(): void {
    const currentQuestion = this.currentQuestion

    if (currentQuestion.required) {
      this.feedbackForm.get("answer")?.setValidators(Validators.required)
    } else {
      this.feedbackForm.get("answer")?.clearValidators()
    }

    this.feedbackForm.get("answer")?.updateValueAndValidity()
  }

  async onSubmit(): Promise<void> {
    this.showError = false

    // Check if answer is required but empty
    if (this.currentQuestion.required && !this.feedbackForm.get("answer")?.value) {
      this.showError = true
      return
    }

    // Save the current answer
    this.answers[this.currentQuestionIndex] = this.feedbackForm.get("answer")?.value || ""

    if (this.currentQuestionIndex < this.questions().length - 1) {
      // Move to next question
      this.currentQuestionIndex++

      // Update validators for the new question
      this.updateFormValidators()

      // Set the form value to any previously saved answer for this question
      this.feedbackForm.patchValue({
        answer: this.answers[this.currentQuestionIndex] || "",
      })
    } else {
      this.isSubmitted = true
      await this.apiFetchService.submitFeedback(this.questions().map((question, index) => ({
        questionId: question.id,
        answer: this.answers[index] || "",
      } as FeedbackSubmission)));
    }
  }

  goToPrevious(): void {
    if (this.currentQuestionIndex > 0) {
      // Save current answer before going back
      this.answers[this.currentQuestionIndex] = this.feedbackForm.get("answer")?.value || ""

      // Go to previous question
      this.currentQuestionIndex--

      // Update validators for the new question
      this.updateFormValidators()

      // Set the form value to the saved answer for this question
      this.feedbackForm.patchValue({
        answer: this.answers[this.currentQuestionIndex] || "",
      })

      this.showError = false
    }
  }

  resetForm(): void {
    this.isSubmitted = false
    this.currentQuestionIndex = 0
    this.answers = {}
    this.feedbackForm.reset()
    this.showError = false
    this.updateFormValidators()
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
    const min = this.currentQuestion.minRating || 1
    const max = this.currentQuestion.maxRating || 5
    return Array.from({ length: max - min + 1 }, (_, i) => min + i)
  }

  getRatingLabel(rating: number): string {
    if (!this.currentQuestion.ratingLabels) return rating.toString()

    const labels = this.currentQuestion.ratingLabels.split(",").map((label) => label.trim())
    const min = this.currentQuestion.minRating || 1
    const index = rating - min

    if (index >= 0 && index < labels.length) {
      return labels[index]
    }

    return rating.toString()
  }
}
