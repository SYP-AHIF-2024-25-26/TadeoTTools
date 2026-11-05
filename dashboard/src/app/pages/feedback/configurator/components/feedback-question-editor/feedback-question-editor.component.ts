import {
  Component,
  inject,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DialogComponent } from '@/shared/components/dialog/dialog.component';
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
  imports: [ReactiveFormsModule, DialogComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './feedback-question-editor.component.html',
})
export class FeedbackQuestionEditorComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly questionForm = input.required<FormGroup<QuestionFormGroup>>();
  readonly editingIndex = input.required<number>();
  readonly allQuestions = input<FeedbackQuestion[]>([]);

  readonly save = output<void>();
  readonly cancel = output<void>();

  // Questions a condition can refer to: saved choice and rating questions, except the one being edited.
  readonly availableParentQuestions = computed(() => {
    const questions = this.allQuestions();
    const currentIndex = this.editingIndex();
    return questions.filter(
      (q, i) =>
        i !== currentIndex &&
        (q.type === 'SingleChoice' ||
          q.type === 'MultipleChoice' ||
          q.type === 'Rating') &&
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
    this.dependenciesArray.push(
      this.fb.group<DependencyFormGroup>({
        dependsOnQuestionId: this.fb.control(0),
        conditionValues: this.fb.control<string[]>([]),
      })
    );
  }

  removeDependency(index: number): void {
    this.dependenciesArray.removeAt(index);
  }

  /** The chosen values belong to the previous question, so a new question starts with none. */
  clearConditionValues(index: number): void {
    this.dependenciesArray.at(index).controls.conditionValues.setValue([]);
  }

  /** Checks or unchecks one accepted answer; the result keeps the order of the answers. */
  toggleConditionValue(index: number, value: string): void {
    const group = this.dependenciesArray.at(index);
    const chosen = new Set(group.controls.conditionValues.value);
    if (chosen.has(value)) {
      chosen.delete(value);
    } else {
      chosen.add(value);
    }
    const order = this.getParentQuestionOptions(
      group.controls.dependsOnQuestionId.value
    );
    group.controls.conditionValues.setValue(order.filter((v) => chosen.has(v)));
  }

  /** The answers a condition can accept: the options, or the values of a rating. */
  getParentQuestionOptions(questionId: number | string | undefined): string[] {
    const question = this.parentQuestion(questionId);
    if (question?.type === 'Rating') {
      // A rating answer is stored as its number, e.g. "1".
      const min = question.minRating ?? 1;
      const max = question.maxRating ?? 5;
      return Array.from({ length: max - min + 1 }, (_, i) => `${min + i}`);
    }
    return question?.options || [];
  }

  /** A rating value with its label, if the question has one ("1 – schlecht"). */
  valueLabel(questionId: number | string | undefined, value: string): string {
    const question = this.parentQuestion(questionId);
    if (question?.type !== 'Rating' || !question.ratingLabels) return value;
    const labels = question.ratingLabels.split(',').map((l) => l.trim());
    const label = labels[Number(value) - (question.minRating ?? 1)];
    return label ? `${value} – ${label}` : value;
  }

  private parentQuestion(
    questionId: number | string | undefined
  ): FeedbackQuestion | undefined {
    if (!questionId) return undefined;
    const numericId = Number(questionId);
    if (isNaN(numericId)) return undefined;
    return this.allQuestions().find((q) => q.id === numericId);
  }

  isChoiceType(): boolean {
    const type = this.questionForm().get('type')?.value;
    return type === 'SingleChoice' || type === 'MultipleChoice';
  }
}
