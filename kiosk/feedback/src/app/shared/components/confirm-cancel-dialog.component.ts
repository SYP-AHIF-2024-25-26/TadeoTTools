import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { DialogComponent } from './dialog.component';

/** Asks before the running feedback is thrown away. */
@Component({
  selector: 'app-confirm-cancel-dialog',
  imports: [DialogComponent],
  template: `
    <app-dialog
      labelledBy="cancel-title"
      describedBy="cancel-text"
      (dismiss)="keep.emit()"
    >
      <h2 id="cancel-title" class="text-2xl font-bold">Feedback abbrechen?</h2>
      <p id="cancel-text" class="mt-3 text-lg text-gray-600">
        Die bisherigen Antworten werden verworfen und nicht gespeichert.
      </p>
      <div class="mt-8 flex flex-wrap justify-end gap-4">
        <button
          type="button"
          class="h-14 rounded-2xl bg-gray-100 px-6 text-lg font-medium text-gray-800 hover:bg-gray-200"
          data-initial-focus
          (click)="keep.emit()"
        >
          Weiter ausfüllen
        </button>
        <button
          type="button"
          class="h-14 rounded-2xl bg-red-700 px-6 text-lg font-medium text-white shadow-md hover:bg-red-800"
          (click)="discard.emit()"
        >
          Verwerfen
        </button>
      </div>
    </app-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmCancelDialogComponent {
  readonly keep = output();
  readonly discard = output();
}
