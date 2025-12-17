import { Component, input, output } from '@angular/core';
import { Stop } from '@/shared/models/types';

@Component({
  selector: 'app-add-stop-dialog',
  standalone: true,
  imports: [],
  templateUrl: './add-stop-dialog.component.html',
})
export class AddStopDialogComponent {
  stops = input.required<Stop[]>();

  close = output<void>();
  addStop = output<number>();
}
