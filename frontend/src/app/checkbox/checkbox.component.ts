import { Component, Input, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { GUIDE_CARD_PREFIX, MANUAL_CHECK_PREFIX } from '../constants';

@Component({
  selector: 'app-checkbox',
  imports: [FormsModule, NgClass, NgIf],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
  standalone: true,
})
export class CheckboxComponent {
  @Input() id!: string;
  @Input() parent!: string;
  isChecked: WritableSignal<boolean> = signal(false);

  ngAfterViewInit() {
    setTimeout(() => {
      this.isChecked.set(localStorage.getItem(this.parent + this.id) === 'true');
    }, 0);
  }

  toggleCheckbox() {
    this.isChecked.update((old) => !old);
    localStorage.setItem(this.parent + this.id, String(this.isChecked()));
    if (this.parent === GUIDE_CARD_PREFIX) {
      localStorage.setItem(MANUAL_CHECK_PREFIX + this.id, String(this.isChecked()));
    }
  }
}
