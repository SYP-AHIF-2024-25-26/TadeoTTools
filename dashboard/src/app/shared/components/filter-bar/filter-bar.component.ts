import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { Division } from '@/shared/models/types';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter',
  standalone: true,
  templateUrl: './filter-bar.component.html',
  imports: [FormsModule],
})
export class FilterComponent {
  @Input() elements!: Division[];
  @Input() outsideFilterValue: number = 0;
  @Output() filter = new EventEmitter<number>();

  filterValue = signal<number>(0);

  clearFilter() {
    this.filterValue.set(0);
  }

  onFilterChange(event: Event) {
    this.filter.emit(this.filterValue());
  }
}
