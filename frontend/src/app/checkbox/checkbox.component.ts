import { Component, Input, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { GUIDE_CARD_PREFIX, MANUAL_CHECK_PREFIX } from '../constants';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    NgIf,
  ],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css'
})
export class CheckboxComponent {
  @Input() id!: string;
  @Input() parent!: string;
  isChecked: WritableSignal<boolean> = signal(false);

  ngAfterViewInit() {
    setTimeout(() => {
      this.isChecked.set(sessionStorage.getItem(this.parent + this.id) === 'true');
    }, 0);
  }

  toggleCheckbox() {
    this.isChecked.update(old => !old);
    sessionStorage.setItem(this.parent + this.id, String(this.isChecked()));
    if (this.parent === GUIDE_CARD_PREFIX) {
      sessionStorage.setItem(MANUAL_CHECK_PREFIX + this.id, String(this.isChecked()));
    }
  }
}
