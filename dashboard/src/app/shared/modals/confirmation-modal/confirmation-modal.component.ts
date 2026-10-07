import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-delete-popup',
  templateUrl: './confirmation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cancelPopup()' },
})
export class DeletePopupComponent implements AfterViewInit {
  title = input<string>('Delete');
  message = input<string>('');
  confirmLabel = input<string>('Delete');
  cancelLabel = input<string>('Cancel');
  // When set, the user must type this exact text before confirming.
  confirmText = input<string>('');
  busy = input<boolean>(false);
  // 'danger' for deletions, 'primary' for confirming a bulk action.
  tone = input<'danger' | 'primary'>('danger');
  // Optional extra action shown left of Cancel, e.g. "Export first".
  secondaryLabel = input<string>('');

  removeConfirmed = output<void>();
  cancel = output<void>();
  secondary = output<void>();

  readonly titleId = `confirm-title-${nextId++}`;
  typed = signal('');
  canConfirm = computed(
    () =>
      !this.busy() &&
      (this.confirmText() === '' || this.typed().trim() === this.confirmText())
  );

  private cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');

  ngAfterViewInit() {
    // Start on the safe choice.
    this.cancelButton()?.nativeElement.focus();
  }

  confirmRemove() {
    if (this.canConfirm()) {
      this.removeConfirmed.emit();
    }
  }

  cancelPopup() {
    if (!this.busy()) {
      this.cancel.emit();
    }
  }
}
