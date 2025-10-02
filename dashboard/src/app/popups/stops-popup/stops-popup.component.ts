import {Component, EventEmitter, Input, Output} from '@angular/core';
import {StudentWithUI} from "../../pages/list-students/list-students.component";
import {Status, Stop} from "../../types";

@Component({
  selector: 'app-stops-popup',
  imports: [],
  templateUrl: './stops-popup.component.html'
})
export class StopsPopupComponent {
  @Input() student!: StudentWithUI;
  @Input() allStops: Stop[] = [];

  @Output() cancel = new EventEmitter<void>();
  @Output() apply = new EventEmitter<StudentWithUI>();
  @Output() stopToggle = new EventEmitter<{ student: StudentWithUI, stop: Stop, checked: boolean }>();

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
