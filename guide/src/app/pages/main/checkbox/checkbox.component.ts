import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent {
  checked = model<boolean>(false);
  /** Accessible name, e.g. "Robotik-Labor gesehen". */
  label = input.required<string>();
}
