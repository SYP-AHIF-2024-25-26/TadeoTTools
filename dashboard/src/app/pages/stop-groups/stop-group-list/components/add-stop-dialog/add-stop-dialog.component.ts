import { Component, input, output } from '@angular/core';
import { Stop } from '@/shared/models/types';
import { DialogComponent } from '@/shared/components/dialog/dialog.component';

@Component({
  selector: 'app-add-stop-dialog',
  imports: [DialogComponent],
  templateUrl: './add-stop-dialog.component.html',
})
export class AddStopDialogComponent {
  stops = input.required<Stop[]>();

  close = output<void>();
  addStop = output<number>();
}
