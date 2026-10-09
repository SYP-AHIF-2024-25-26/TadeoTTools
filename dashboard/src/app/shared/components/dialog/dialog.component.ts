import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  output,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';

let nextId = 0;
// Open dialogs, newest last: Escape only closes the topmost one, e.g. a
// confirmation opened from inside a form dialog.
const openDialogs: DialogComponent[] = [];

/**
 * The one dialog shell of the dashboard (DESIGN.md, Dialogs): scrim, panel,
 * title with a close button, scrolling content and right-aligned actions
 * (`<div dialog-actions class="contents">`, primary last). Escape, the
 * scrim and the close button all emit `close`; while `busy` nothing closes.
 * Mark the element that should get focus first with `cdkFocusInitial`.
 */
@Component({
  selector: 'app-dialog',
  imports: [CdkTrapFocus],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      (click)="requestClose()"
    >
      <div
        class="flex max-h-[90vh] w-full flex-col rounded-lg bg-background-100 p-6 shadow-lg dark:bg-background-800"
        [class.max-w-md]="size() === 'md'"
        [class.max-w-2xl]="size() === 'lg'"
        [attr.role]="role()"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        (click)="$event.stopPropagation()"
      >
        <div class="mb-4 flex items-start justify-between gap-4">
          <h2 [id]="titleId" class="text-lg font-bold">{{ title() }}</h2>
          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm -mr-2 -mt-1"
            aria-label="Close"
            [disabled]="busy()"
            (click)="requestClose()"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          <ng-content />
        </div>
        <div class="flex flex-wrap justify-end gap-2 pt-6 empty:hidden">
          <ng-content select="[dialog-actions]" />
        </div>
      </div>
    </div>
  `,
})
export class DialogComponent implements OnDestroy {
  title = input.required<string>();
  // md for confirmations, lg for forms.
  size = input<'md' | 'lg'>('lg');
  // alertdialog for confirmations of destructive actions.
  role = input<'dialog' | 'alertdialog'>('dialog');
  busy = input<boolean>(false);

  close = output<void>();

  readonly titleId = `dialog-title-${nextId++}`;

  constructor() {
    openDialogs.push(this);
  }

  ngOnDestroy() {
    openDialogs.splice(openDialogs.indexOf(this), 1);
  }

  onEscape() {
    if (openDialogs.at(-1) === this) {
      this.requestClose();
    }
  }

  requestClose() {
    if (!this.busy()) {
      this.close.emit();
    }
  }
}
