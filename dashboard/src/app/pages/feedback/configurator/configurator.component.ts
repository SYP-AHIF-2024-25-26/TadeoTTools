import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FeedbackService } from '@/core/services/feedback.service';
import {
  FeedbackQuestion,
  FeedbackDependency,
  FeedbackResponses,
} from '@/shared/models/types';
import { FeedbackPreviewComponent } from './components/feedback-preview/feedback-preview.component';
import { FeedbackQuestionListComponent } from './components/feedback-question-list/feedback-question-list.component';
import { FeedbackQuestionEditorComponent } from './components/feedback-question-editor/feedback-question-editor.component';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { downloadFile } from '@/shared/utils/utils';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { FeedbackResponsesComponent } from '../responses/feedback-responses.component';

export type QuestionType =
  | 'Text'
  | 'Rating'
  | 'SingleChoice'
  | 'MultipleChoice';

export interface QuestionFormGroup {
  question: FormControl<string>;
  type: FormControl<QuestionType>;
  required: FormControl<boolean>;
  placeholder: FormControl<string>;
  options: FormArray<FormControl<string>>;
  minRating: FormControl<number>;
  maxRating: FormControl<number>;
  ratingLabels: FormControl<string>;
  dependencies: FormArray<FormGroup<DependencyFormGroup>>;
}

export interface DependencyFormGroup {
  dependsOnQuestionId: FormControl<number>;
  conditionValue: FormControl<string>;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './configurator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FeedbackPreviewComponent,
    FeedbackQuestionListComponent,
    FeedbackQuestionEditorComponent,
    FeedbackResponsesComponent,
    DeletePopupComponent,
    RouterLink,
  ],
})
export class FeedbackConfiguratorComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly feedbackService = inject(FeedbackService);
  private scrollService = inject(ScrollPersistenceService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  saving = signal<boolean>(false);

  private queryParams = toSignal(this.route.queryParamMap);
  readonly tab = computed<'questions' | 'responses'>(() =>
    this.queryParams()?.get('tab') === 'responses' ? 'responses' : 'questions'
  );

  readonly responses = signal<FeedbackResponses | null>(null);
  readonly responsesLoading = signal(false);
  readonly responsesFailed = signal(false);

  // The questions as last loaded from the server, to tell which saved ones a save would delete.
  private savedQuestions: FeedbackQuestion[] = [];
  readonly confirmingDeletedAnswers = signal<{
    message: string;
    confirmLabel: string;
  } | null>(null);

  constructor() {
    // Fresh numbers whenever the tab changes, including the first load; the count also feeds the tab badge.
    effect(() => {
      this.tab();
      untracked(() => this.loadResponses());
    });
  }

  // State signals
  readonly questions = signal<FeedbackQuestion[]>([]);
  readonly showQuestionEditor = signal(false);
  readonly editingIndex = signal(-1);
  readonly isPreviewMode = signal(false);

  questionForm = this.createQuestionForm();

  get optionsArray(): FormArray<FormControl<string>> {
    return this.questionForm.get('options') as FormArray<FormControl<string>>;
  }

  get dependenciesArray(): FormArray<FormGroup<DependencyFormGroup>> {
    return this.questionForm.get('dependencies') as FormArray<
      FormGroup<DependencyFormGroup>
    >;
  }

  async ngOnInit(): Promise<void> {
    await this.loadQuestions();
    this.scrollService.restoreScroll();
  }

  createQuestionForm(): FormGroup<QuestionFormGroup> {
    return this.fb.group({
      question: ['', Validators.required],
      type: this.fb.control<QuestionType>('Text'),
      required: [true],
      placeholder: ['Enter your answer'],
      options: this.fb.array<FormControl<string>>([]),
      minRating: [1],
      maxRating: [5],
      ratingLabels: ['Poor, Average, Excellent'],
      dependencies: this.fb.array<FormGroup<DependencyFormGroup>>([]),
    });
  }

  async loadQuestions(): Promise<void> {
    try {
      const fetchedQuestions =
        await this.feedbackService.getAllFeedbackQuestions();
      this.questions.set(fetchedQuestions);
      this.savedQuestions = fetchedQuestions;
    } catch (error) {
      console.error('Failed to load feedback questions', error);
      this.toast.error(
        errorText(error, 'The feedback questions could not be loaded.')
      );
    }
  }

  async loadResponses(): Promise<void> {
    this.responsesLoading.set(true);
    try {
      this.responses.set(await this.feedbackService.getFeedbackResponses());
      this.responsesFailed.set(false);
    } catch (error) {
      console.error('Failed to load feedback responses', error);
      this.responses.set(null);
      this.responsesFailed.set(true);
    } finally {
      this.responsesLoading.set(false);
    }
  }

  showTab(tab: 'questions' | 'responses'): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'responses' ? 'responses' : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  async downloadCsv(): Promise<void> {
    try {
      const blob = await this.feedbackService.getFeedbackQuestionAnswersFile();
      downloadFile(blob, 'feedback_answers.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(
        errorText(error, 'The feedback answers could not be downloaded.')
      );
    }
  }

  /**
   * Saved questions this save would delete on the server, together with their answers:
   * removed ones, and ones changed to another kind (text, rating, choice), which are replaced.
   */
  private questionsLosingAnswers(): { question: string; answers: number }[] {
    const kind = (q: FeedbackQuestion) =>
      q.type === 'SingleChoice' || q.type === 'MultipleChoice'
        ? 'Choice'
        : q.type;
    const current = new Map(
      this.questions()
        .filter((q) => q.id !== undefined)
        .map((q) => [q.id, q])
    );
    const answered = new Map(
      (this.responses()?.questions ?? []).map((s) => [
        s.questionId,
        s.answeredCount,
      ])
    );

    return this.savedQuestions
      .filter((saved) => {
        const now = current.get(saved.id);
        return !now || kind(now) !== kind(saved);
      })
      .map((saved) => ({
        question: saved.question,
        answers: answered.get(saved.id!) ?? 0,
      }))
      .filter((q) => q.answers > 0);
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
    this.dependenciesArray.clear();

    this.questionForm.patchValue({
      question: question.question,
      type: question.type,
      required: question.required,
      placeholder: question.placeholder || 'Enter your answer',
      minRating: question.minRating ?? 1,
      maxRating: question.maxRating ?? 5,
      ratingLabels: question.ratingLabels || 'Poor, Average, Excellent',
    });

    // Add options for choice types
    if (
      question.type === 'SingleChoice' ||
      question.type === 'MultipleChoice'
    ) {
      const options = question.options?.length
        ? question.options
        : ['Option 1', 'Option 2'];
      options.forEach((option) =>
        this.optionsArray.push(this.fb.control(option))
      );
    }

    // Add dependencies
    if (question.dependencies?.length) {
      question.dependencies.forEach((dep) => {
        this.dependenciesArray.push(this.createDependencyFormGroup(dep));
      });
    }

    this.showQuestionEditor.set(true);
  }

  createDependencyFormGroup(
    dep?: FeedbackDependency
  ): FormGroup<DependencyFormGroup> {
    return this.fb.group({
      dependsOnQuestionId: [dep?.dependsOnQuestionId ?? 0],
      conditionValue: [dep?.conditionValue ?? ''],
    });
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
    if (
      formValue.type === 'SingleChoice' ||
      formValue.type === 'MultipleChoice'
    ) {
      question.options = formValue.options.filter((opt) => opt.trim() !== '');
    } else if (formValue.type === 'Rating') {
      question.minRating = formValue.minRating;
      question.maxRating = formValue.maxRating;
      question.ratingLabels = formValue.ratingLabels;
    }

    // Add dependencies
    if (formValue.dependencies.length > 0) {
      question.dependencies = formValue.dependencies
        .filter(
          (d) => d.dependsOnQuestionId > 0 && d.conditionValue.trim() !== ''
        )
        .map((d) => ({
          dependsOnQuestionId: Number(d.dependsOnQuestionId),
          conditionValue: d.conditionValue,
        }));
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

  async saveQuestions(answersConfirmed = false): Promise<void> {
    if (this.saving()) return;

    const losing = this.questionsLosingAnswers();
    if (losing.length > 0 && !answersConfirmed) {
      const total = losing.reduce((sum, q) => sum + q.answers, 0);
      const answers = (n: number) => `${n} ${n === 1 ? 'answer' : 'answers'}`;
      this.confirmingDeletedAnswers.set({
        message:
          'Saving removes these questions, or replaces them because their type changed, and deletes their answers:\n\n' +
          losing
            .map((q) => `“${q.question}”: ${answers(q.answers)}`)
            .join('\n') +
          "\n\nThe answers can't be restored. Download the CSV first if you want to keep them.",
        confirmLabel: `Save and delete ${answers(total)}`,
      });
      return;
    }

    this.saving.set(true);
    try {
      await this.feedbackService.saveFeedbackQuestions(this.questions());
      this.confirmingDeletedAnswers.set(null);
      this.toast.success('Feedback questions saved.');
      // Reload so new questions get their ids and the answer counts match the server again.
      await Promise.all([this.loadQuestions(), this.loadResponses()]);
    } catch (error) {
      console.error('Failed to save feedback questions', error);
      this.toast.error(
        errorText(
          error,
          'The feedback questions could not be saved. Your changes are still here, please try again.'
        )
      );
    } finally {
      this.saving.set(false);
    }
  }

  // Helper to get choice questions for dependency selection
  getChoiceQuestions(): FeedbackQuestion[] {
    return this.questions().filter(
      (q) => q.type === 'SingleChoice' || q.type === 'MultipleChoice'
    );
  }
}
