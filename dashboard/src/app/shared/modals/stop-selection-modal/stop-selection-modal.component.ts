import {
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { StudentWithUI } from '../../../pages/students/student-list/student-list.component';
import { Status, Stop } from '../../models/types';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-stops-popup',
  imports: [FormsModule],
  templateUrl: './stop-selection-modal.component.html',
})
export class StopsPopupComponent {
  @Input() student!: StudentWithUI;
  @Input() allStops: Stop[] = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() apply = new EventEmitter<StudentWithUI>();
  @Output() stopToggle = new EventEmitter<{
    student: StudentWithUI;
    stop: Stop;
    checked: boolean;
  }>();

  searchTerm = signal<string>('');

  filteredStops = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.allStops;
    }
    return this.allStops.filter((stop) =>
      stop.name.toLowerCase().includes(term)
    );
  });

  protected readonly Status = Status;

  isStopSelected(student: StudentWithUI, stopId: number): boolean {
    return student.selectedStops?.has(stopId) || false;
  }

  onToggle(stop: Stop, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.stopToggle.emit({ student: this.student, stop, checked });
  }

  onCancel() {
    this.cancel.emit();
  }

  onApply() {
    this.apply.emit(this.student);
  }
}
