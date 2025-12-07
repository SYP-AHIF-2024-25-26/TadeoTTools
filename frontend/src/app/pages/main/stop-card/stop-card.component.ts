import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
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
  id = input.required<string>();
  @ViewChild(CheckboxComponent) checkbox!: CheckboxComponent;
  colors = input.required<string[]>();
  @Output() openStopDescriptionPage = new EventEmitter<void>();
  @Output() onChange = new EventEmitter<void>();

  public isChecked() {
    return this.checkbox?.isChecked() ?? false;
  }

  protected generateGradient(colors: string[]): string {
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }
}
