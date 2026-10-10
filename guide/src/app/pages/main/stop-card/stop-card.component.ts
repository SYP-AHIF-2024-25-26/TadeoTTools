import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
  model,
  Output,
  ViewChild,
} from '@angular/core';
import { CheckboxComponent } from '@pages/main/checkbox/checkbox.component';
import { NgClass, NgStyle } from '@angular/common';
import { Stop } from '@shared/models/types';

@Component({
  selector: 'app-stop-card',
  imports: [CheckboxComponent, NgClass, NgStyle],
  templateUrl: './stop-card.component.html',
  styleUrl: './stop-card.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopCardComponent {
  stop = input.required<Stop>();
  colors = input.required<string[]>();
  checked = model<boolean>(false);
  @Output() openStopDescriptionPage = new EventEmitter<void>();
  @Output() onChange = new EventEmitter<void>();

  protected generateGradient(colors: string[]): string {
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }
}
