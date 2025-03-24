import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { Division } from '../../types';

@Component({
    selector: 'app-chip',
    standalone: true,
    imports: [NgStyle],
    templateUrl: './chip.component.html',
    styleUrl: './chip.component.css'
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
