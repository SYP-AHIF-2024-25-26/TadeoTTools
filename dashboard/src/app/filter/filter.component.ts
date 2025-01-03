import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Division} from "../types";

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css'
})
export class FilterComponent {
  @Input() elements!: Division[];
  @Output() filter = new EventEmitter<number>();

  onFilterChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const divisionId = parseInt(selectElement.value, 10);
    this.filter.emit(divisionId);
  }
}
