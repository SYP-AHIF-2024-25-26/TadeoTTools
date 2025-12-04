import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stop-group-header',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './stop-group-header.component.html',
})
export class StopGroupHeaderComponent {
  hasChanged = input.required<boolean>();
  onlyPublicGroups = input.required<boolean>();

  addGroup = output<void>();
  toggleCollapse = output<void>();
  togglePublicGroups = output<void>();
  save = output<void>();
  cancel = output<void>();
}
