import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiFetchService } from '../api-fetch.service';
import { FeedbackQuestion, FeedbackSubmission } from '../types';
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
  questions: WritableSignal<FeedbackQuestion[]> = signal([]);
  currentQuestionIndex = 0;
  answers: string[] = [];
  form!: FormGroup;

  private fb: FormBuilder = inject(FormBuilder);
  private apiFetchService: ApiFetchService = inject(ApiFetchService);

  isLastQuestion = () => this.currentQuestionIndex === this.questions().length - 1;
  async nextOrSubmit(): Promise<void> {
    if (this.form.valid) {
      this.answers[this.currentQuestionIndex] = this.form.value.answer;

      if (!this.isLastQuestion()) {
        this.currentQuestionIndex++;
        this.form.reset();
      } else {
        const feedbackSubmissions = this.answers.map((answer, index) => ({ questionId: this.questions()[index].id, answer: answer } as FeedbackSubmission));
        await this.apiFetchService.submitFeedback(feedbackSubmissions);
        this.currentQuestionIndex = 0;
        this.form.reset();
      }
    }
  }

  async ngOnInit(): Promise<void> {
    this.questions.set(await this.apiFetchService.getAllFeedbackQuestions());
    this.form = this.fb.group({
      answer: ['', Validators.required]
    });
  }
}
