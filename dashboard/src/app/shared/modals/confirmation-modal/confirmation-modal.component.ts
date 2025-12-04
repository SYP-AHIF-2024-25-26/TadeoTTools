import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-delete-popup',
  templateUrl: './confirmation-modal.component.html',
  standalone: true,
})
export class DeletePopupComponent {
  @Input() title: string = 'Default Title';
  @Input() message: string = 'Default message content.';
  @Output() removeConfirmed = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  confirmRemove() {
    this.removeConfirmed.emit();
  }

  cancelPopup() {
    this.cancel.emit();
  }
}
