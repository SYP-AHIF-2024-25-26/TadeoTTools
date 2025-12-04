import { Component, inject, input, output } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-feedback-question-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './feedback-question-editor.component.html',
})
export class FeedbackQuestionEditorComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly questionForm = input.required<
    FormGroup<{
      question: FormControl<string>;
      type: FormControl<'text' | 'choice' | 'rating'>;
      required: FormControl<boolean>;
      placeholder: FormControl<string>;
      options: FormArray<FormControl<string>>;
      minRating: FormControl<number>;
      maxRating: FormControl<number>;
      ratingLabels: FormControl<string>;
    }>
  >();
  readonly editingIndex = input.required<number>();

  readonly save = output<void>();
  readonly cancel = output<void>();

  get optionsArray(): FormArray<FormControl<string>> {
    return this.questionForm().get('options') as FormArray<FormControl<string>>;
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
}
