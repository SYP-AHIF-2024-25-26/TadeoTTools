import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-delete-popup',
  standalone: true,
  imports: [],
  templateUrl: './delete-popup.component.html',
  styleUrl: './delete-popup.component.css'
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
