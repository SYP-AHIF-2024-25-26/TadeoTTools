import { Component, inject, input, output, computed } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { FeedbackQuestion } from '@/shared/models/types';
import {
  QuestionFormGroup,
  DependencyFormGroup,
  QuestionType,
} from '../../configurator.component';

@Component({
  selector: 'app-feedback-question-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './feedback-question-editor.component.html',
})
export class FeedbackQuestionEditorComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly questionForm = input.required<FormGroup<QuestionFormGroup>>();
  readonly editingIndex = input.required<number>();
  readonly allQuestions = input<FeedbackQuestion[]>([]);

  readonly save = output<void>();
  readonly cancel = output<void>();

  // Computed: available parent questions for dependencies (choice questions only, excluding current)
  readonly availableParentQuestions = computed(() => {
    const questions = this.allQuestions();
    const currentIndex = this.editingIndex();
    return questions.filter(
      (q, i) =>
        i !== currentIndex &&
        (q.type === 'SingleChoice' || q.type === 'MultipleChoice') &&
        q.id !== undefined
    );
  });

  get optionsArray(): FormArray<FormControl<string>> {
    return this.questionForm().get('options') as FormArray<FormControl<string>>;
  }

  get dependenciesArray(): FormArray<FormGroup<DependencyFormGroup>> {
    return this.questionForm().get('dependencies') as FormArray<
      FormGroup<DependencyFormGroup>
    >;
  }

  addOption(): void {
    let counter = this.optionsArray.length + 1;
    let uniqueValue = `Option ${counter}`;

    while (
      this.optionsArray.controls.some(
        (control) => control.value.trim() === uniqueValue
      )
    ) {
      counter++;
      uniqueValue = `Option ${counter}`;
    }

    this.optionsArray.push(this.fb.control(uniqueValue));
  }

  removeOption(index: number): void {
    if (this.optionsArray.length > 1) {
      this.optionsArray.removeAt(index);
    }
  }

  hasDuplicateOption(index: number): boolean {
    const currentValue = this.optionsArray.at(index).value.trim();
    if (!currentValue) return false;

    return this.optionsArray.controls.some(
      (control, i) => i !== index && control.value.trim() === currentValue
    );
  }

  addDependency(): void {
    const group = this.fb.group<DependencyFormGroup>({
      dependsOnQuestionId: this.fb.control(0),
      conditionValue: this.fb.control(''),
    });
    this.dependenciesArray.push(group);
  }

  removeDependency(index: number): void {
    this.dependenciesArray.removeAt(index);
  }

  getParentQuestionOptions(questionId: number | undefined): string[] {
    if (!questionId) return [];
    const question = this.allQuestions().find((q) => q.id === questionId);
    return question?.options || [];
  }

  isChoiceType(): boolean {
    const type = this.questionForm().get('type')?.value;
    return type === 'SingleChoice' || type === 'MultipleChoice';
  }
}
