import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { NgClass, NgStyle } from '@angular/common';
import { Stop } from '../types';

@Component({
  selector: 'app-stop-card',
  imports: [CheckboxComponent, NgClass, NgStyle],
  templateUrl: './stop-card.component.html',
  styleUrl: './stop-card.component.css',
  standalone: true,
})
export class StopCardComponent {
  @Input() stop!: Stop;
  @Input() id!: string;
  @ViewChild(CheckboxComponent) checkbox!: CheckboxComponent;
  @Input() colors!: string[];
  @Output() openStopDescriptionPage = new EventEmitter<void>();
  @Output() onChange = new EventEmitter<void>();

  public isChecked() {
    return this.checkbox?.isChecked() ?? false;
  }

  protected generateGradient(colors: string[]): string {
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }
}
