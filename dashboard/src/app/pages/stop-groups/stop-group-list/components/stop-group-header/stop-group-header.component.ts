import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stop-group-header',
  imports: [FormsModule],
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
