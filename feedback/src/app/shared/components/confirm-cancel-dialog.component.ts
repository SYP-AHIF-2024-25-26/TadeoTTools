import { ChangeDetectionStrategy, Component, output } from '@angular/core';

/** Asks before the running feedback is thrown away. */
@Component({
  selector: 'app-confirm-cancel-dialog',
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      role="presentation"
      (click)="keep.emit()"
    >
      <div
        class="w-full max-w-lg rounded-lg bg-white p-8 shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        aria-describedby="cancel-text"
        tabindex="-1"
        (click)="$event.stopPropagation()"
        (keydown.escape)="keep.emit()"
      >
        <h2 id="cancel-title" class="text-2xl font-bold">
          Feedback abbrechen?
        </h2>
        <p id="cancel-text" class="mt-3 text-lg text-gray-600">
          Die bisherigen Antworten werden verworfen und nicht gespeichert.
        </p>
        <div class="mt-8 flex flex-wrap justify-end gap-4">
          <button
            type="button"
            class="h-14 rounded-2xl bg-gray-100 px-6 text-lg font-medium text-gray-800 hover:bg-gray-200"
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
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmCancelDialogComponent {
  readonly keep = output();
  readonly discard = output();
}
