import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Stop } from '@/shared/models/types';

@Component({
  selector: 'app-stop-general-info',
  imports: [FormsModule],
  templateUrl: './stop-general-info.component.html',
})
export class StopGeneralInfoComponent {
  stop = model.required<Stop>();
}
