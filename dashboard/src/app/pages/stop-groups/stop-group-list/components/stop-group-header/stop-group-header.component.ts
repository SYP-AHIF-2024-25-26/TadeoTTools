import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stop-group-header',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './stop-group-header.component.html',
})
export class StopGroupHeaderComponent {
  hasChanged = input.required<boolean>();
  onlyPublicGroups = input.required<boolean>();
  saving = input<boolean>(false);

  togglePublicGroups = output<void>();
  save = output<void>();
  cancel = output<void>();
}
