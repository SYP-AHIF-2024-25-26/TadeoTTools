import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { DialogComponent } from './dialog.component';

/**
 * Asks before something is thrown away. The safe answer is on the left and
 * gets the focus; the destructive one is red and names the action.
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogComponent],
  template: `
    <app-dialog
      labelledBy="confirm-title"
      describedBy="confirm-text"
      (dismiss)="keep.emit()"
    >
      <h2 id="confirm-title" class="text-2xl font-bold">{{ title() }}</h2>
      <p id="confirm-text" class="mt-3 text-lg text-gray-600">{{ text() }}</p>
      <div class="mt-8 flex flex-wrap justify-end gap-4">
        <button
          type="button"
          class="h-14 rounded-2xl bg-gray-100 px-6 text-lg font-medium text-gray-800 hover:bg-gray-200"
          data-initial-focus
          (click)="keep.emit()"
        >
          {{ keepLabel() }}
        </button>
        <button
          type="button"
          class="h-14 rounded-2xl bg-red-700 px-6 text-lg font-medium text-white shadow-md hover:bg-red-800"
          (click)="confirm.emit()"
        >
          {{ confirmLabel() }}
        </button>
      </div>
    </app-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  readonly keepLabel = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly keep = output();
  readonly confirm = output();
}
