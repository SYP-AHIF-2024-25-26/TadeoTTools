import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-checkbox',
  imports: [FormsModule, NgClass, NgIf],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent {
  checked = model<boolean>(false);

  toggleCheckbox() {
    this.checked.update((old) => !old);
  }
}
