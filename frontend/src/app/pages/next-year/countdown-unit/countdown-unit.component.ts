import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-countdown-unit',
  imports: [],
  templateUrl: './countdown-unit.component.html',
  styleUrl: './countdown-unit.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownUnitComponent {
  value = input(0);
  label = input('');

  get displayValue(): string {
    return this.value().toString().padStart(2, '0');
  }
}
