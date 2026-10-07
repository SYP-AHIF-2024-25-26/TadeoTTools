import { Component, input, output, signal } from '@angular/core';
import { Division } from '@/shared/models/types';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter',
  templateUrl: './filter-bar.component.html',
  imports: [FormsModule],
})
export class FilterComponent {
  elements = input<Division[]>([]);
  filter = output<number>();

  filterValue = signal<number>(0);

  clearFilter() {
    this.filterValue.set(0);
  }

  onFilterChange() {
    this.filter.emit(this.filterValue());
  }
}
