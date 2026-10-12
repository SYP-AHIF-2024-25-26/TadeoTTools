import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CheckboxComponent } from '@pages/main/checkbox/checkbox.component';
import { Stop } from '@shared/models/types';
import { divisionFill } from '@shared/division-colors';

@Component({
  selector: 'app-stop-card',
  imports: [CheckboxComponent],
  templateUrl: './stop-card.component.html',
  styleUrl: './stop-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopCardComponent {
  stop = input.required<Stop>();
  colors = input.required<string[]>();
  checked = input<boolean>(false);
  open = output<void>();
  toggled = output<void>();

  protected fill = computed(() => divisionFill(this.colors()));
}
