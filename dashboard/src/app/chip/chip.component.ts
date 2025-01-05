import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass, NgStyle} from "@angular/common";
import {Division} from "../types";

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [
    NgStyle,
  ],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.css'
})
export class ChipComponent {
  @Input() division!: Division;
  @Output() remove = new EventEmitter<number>();

  onRemove() {
    this.remove.emit(this.division.id);
  }
}
