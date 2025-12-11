import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './status-chip.component.html',
})
export class ChipComponent {
  @Input() id: string = '';
  @Input() value: string = '';
  @Input() color: string = '#007bff';
  @Output() remove = new EventEmitter<string>();

  onRemove() {
    this.remove.emit(this.id);
  }
}
