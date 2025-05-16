import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-countdown-unit',
  imports: [],
  templateUrl: './countdown-unit.component.html',
  styleUrl: './countdown-unit.component.css',
  standalone: true,
})
export class CountdownUnitComponent {
  @Input() value = 0;
  @Input() label = '';

  get displayValue(): string {
    return this.value.toString().padStart(2, '0');
  }
}
