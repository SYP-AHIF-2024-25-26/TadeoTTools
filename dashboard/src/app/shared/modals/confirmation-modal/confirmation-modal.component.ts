import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { DialogComponent } from '@/shared/components/dialog/dialog.component';

@Component({
  selector: 'app-delete-popup',
  templateUrl: './confirmation-modal.component.html',
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletePopupComponent {
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

  typed = signal('');
  canConfirm = computed(
    () =>
      !this.busy() &&
      (this.confirmText() === '' || this.typed().trim() === this.confirmText())
  );

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
