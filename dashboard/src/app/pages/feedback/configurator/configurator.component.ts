import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FeedbackService } from '@/core/services/feedback.service';
import { FeedbackQuestion } from '@/shared/models/types';
import { FeedbackPreviewComponent } from './components/feedback-preview/feedback-preview.component';
import { FeedbackQuestionListComponent } from './components/feedback-question-list/feedback-question-list.component';
import { FeedbackQuestionEditorComponent } from './components/feedback-question-editor/feedback-question-editor.component';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './configurator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FeedbackPreviewComponent,
    FeedbackQuestionListComponent,
    FeedbackQuestionEditorComponent,
  ],
})
export class FeedbackConfiguratorComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly feedbackService = inject(FeedbackService);

  // State signals
  readonly questions = signal<FeedbackQuestion[]>([]);
  readonly showQuestionEditor = signal(false);
  readonly editingIndex = signal(-1);
  readonly isPreviewMode = signal(false);

  // Form configuration signals
  readonly formTitle = signal('Willkommen am');
  readonly formSubtitle = signal('Tag der offenen Tür!');

  // Reactive forms
  readonly configForm = this.fb.group({
    title: ['Willkommen am'],
    subtitle: ['Tag der offenen Tür!'],
  });

  questionForm = this.createQuestionForm();

  get optionsArray(): FormArray<FormControl<string>> {
    return this.questionForm.get('options') as FormArray<FormControl<string>>;
  }

  async ngOnInit(): Promise<void> {
    await this.loadQuestions();
  }

  createQuestionForm(): FormGroup<{
    question: FormControl<string>;
    type: FormControl<'text' | 'choice' | 'rating'>;
    required: FormControl<boolean>;
    placeholder: FormControl<string>;
    options: FormArray<FormControl<string>>;
    minRating: FormControl<number>;
    maxRating: FormControl<number>;
    ratingLabels: FormControl<string>;
  }> {
    return this.fb.group({
      question: ['', Validators.required],
      type: this.fb.control<'text' | 'choice' | 'rating'>('text'),
      required: [true],
      placeholder: ['Enter your answer'],
      options: this.fb.array<FormControl<string>>([]),
      minRating: [0],
      maxRating: [5],
      ratingLabels: ['Poor, Average, Excellent'],
    });
  }

  async loadQuestions(): Promise<void> {
    const fetchedQuestions =
      await this.feedbackService.getAllFeedbackQuestions();
    this.questions.set(fetchedQuestions);
  }

  addNewQuestion(): void {
    this.editingIndex.set(-1);
    this.questionForm = this.createQuestionForm();
    this.showQuestionEditor.set(true);
  }

  editQuestion(index: number): void {
    const question = this.questions()[index];
    this.editingIndex.set(index);
    this.optionsArray.clear();

    this.questionForm.patchValue({
      question: question.question,
      type: question.type,
      required: question.required,
      placeholder: question.placeholder || 'Enter your answer',
      minRating: question.minRating ?? 0,
      maxRating: question.maxRating ?? 5,
      ratingLabels: question.ratingLabels || 'Poor, Average, Excellent',
    });

    // Add options for choice type
    if (question.type === 'choice') {
      const options = question.options?.length
        ? question.options
        : ['Option 1', 'Option 2'];
      options.forEach((option) =>
        this.optionsArray.push(this.fb.control(option))
      );
    }

    this.showQuestionEditor.set(true);
  }

  saveQuestion(): void {
    if (this.questionForm.invalid) return;

    const formValue = this.questionForm.getRawValue();
    const currentQuestions = this.questions();
    const currentEditingIndex = this.editingIndex();

    const question: FeedbackQuestion = {
      question: formValue.question,
      type: formValue.type,
      required: formValue.required,
      placeholder: formValue.placeholder,
      order:
        currentEditingIndex >= 0
          ? currentQuestions[currentEditingIndex].order
          : currentQuestions.length,
    };

    // Include ID if editing
    if (
      currentEditingIndex >= 0 &&
      currentQuestions[currentEditingIndex].id !== undefined
    ) {
      question.id = currentQuestions[currentEditingIndex].id;
    }

    // Add type-specific properties
    if (formValue.type === 'choice') {
      question.options = formValue.options.filter((opt) => opt.trim() !== '');
    } else if (formValue.type === 'rating') {
      question.minRating = formValue.minRating;
      question.maxRating = formValue.maxRating;
      question.ratingLabels = formValue.ratingLabels;
    }

    this.questions.update((questions) => {
      const updated = [...questions];
      if (currentEditingIndex >= 0) {
        updated[currentEditingIndex] = question;
      } else {
        updated.push(question);
      }
      return updated;
    });

    this.closeQuestionEditor();
  }

  closeQuestionEditor(): void {
    this.showQuestionEditor.set(false);
    this.editingIndex.set(-1);
  }

  deleteQuestion(index: number): void {
    if (!confirm('Are you sure you want to delete this question?')) return;

    this.questions.update((questions) =>
      questions
        .filter((_, i) => i !== index)
        .map((q, idx) => ({ ...q, order: idx }))
    );
  }

  drop(event: CdkDragDrop<string[]>): void {
    this.questions.update((questions) => {
      const updated = [...questions];
      moveItemInArray(updated, event.previousIndex, event.currentIndex);
      return updated.map((q, idx) => ({ ...q, order: idx }));
    });
  }

  togglePreview(): void {
    this.isPreviewMode.update((mode) => !mode);
  }

  async saveQuestions(): Promise<void> {
    const { title, subtitle } = this.configForm.getRawValue();
    if (title) this.formTitle.set(title);
    if (subtitle) this.formSubtitle.set(subtitle);

    await this.feedbackService.saveFeedbackQuestions(this.questions());
    alert('Changes saved successfully!');
  }
}
