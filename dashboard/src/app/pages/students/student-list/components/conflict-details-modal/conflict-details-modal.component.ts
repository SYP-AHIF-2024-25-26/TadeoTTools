import { Component, inject, input, output } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Status, Student } from '@/shared/models/types';
import { StudentService } from '@/core/services/student.service';

@Component({
  selector: 'app-conflict-details-modal',
  imports: [CdkTrapFocus],
  templateUrl: './conflict-details-modal.component.html',
  host: { '(document:keydown.escape)': 'close.emit()' },
})
export class ConflictDetailsModalComponent {
  private studentService = inject(StudentService);

  readonly student = input.required<Student>();
  readonly close = output<void>();
  readonly refresh = output<void>();

  protected readonly Status = Status;

  async deleteAssignment(index: number) {
    const s = this.student();
    s.studentAssignments.splice(index, 1);
    await this.studentService.updateStudent(s);
    this.refresh.emit();
  }

  async changeAssignmentStatus(index: number, status: Status) {
    const s = this.student();
    s.studentAssignments[index].status = status;
    await this.studentService.updateStudent(s);
    this.refresh.emit();
  }

  async approveAssignment(index: number): Promise<void> {
    await this.changeAssignmentStatus(index, Status.Accepted);
  }

  async rejectAssignment(index: number): Promise<void> {
    await this.changeAssignmentStatus(index, Status.Declined);
  }

  async undoAssignment(index: number): Promise<void> {
    await this.changeAssignmentStatus(index, Status.Pending);
  }

  getStatusClass(status: Status): string {
    switch (status) {
      case Status.Accepted:
        return 'text-green-700 dark:text-green-400 font-bold';
      case Status.Declined:
        return 'text-red-700 dark:text-red-400 font-bold';
      default:
        return 'text-amber-700 dark:text-amber-400 font-bold';
    }
  }

  getStatusText(status: Status): string {
    switch (status) {
      case Status.Accepted:
        return 'Approved';
      case Status.Declined:
        return 'Rejected';
      default:
        return 'Pending';
    }
  }
}
