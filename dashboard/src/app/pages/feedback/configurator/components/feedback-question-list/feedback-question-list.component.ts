import { Component, input, output } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { FeedbackQuestion } from '../../../../../shared/models/types';

@Component({
  selector: 'app-feedback-question-list',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './feedback-question-list.component.html',
})
export class FeedbackQuestionListComponent {
  readonly questions = input.required<FeedbackQuestion[]>();

  readonly addQuestion = output<void>();
  readonly editQuestion = output<number>();
  readonly deleteQuestion = output<number>();
  readonly reorderQuestions = output<CdkDragDrop<string[]>>();

  onDrop(event: CdkDragDrop<string[]>): void {
    this.reorderQuestions.emit(event);
  }
}
