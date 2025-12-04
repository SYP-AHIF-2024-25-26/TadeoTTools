import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-filters',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './student-filters.component.html',
})
export class StudentFiltersComponent {
  // Options
  readonly uniqueDepartments = input.required<string[]>();
  readonly filteredUniqueClasses = input.required<string[]>();
  readonly uniqueStops = input.required<string[]>();

  // Models (Two-way binding)
  readonly departmentFilter = model.required<string>();
  readonly classFilter = model.required<string>();
  readonly stopFilter = model.required<string>();
  readonly statusFilter = model.required<string>();
  readonly searchTerm = model.required<string>();
}
