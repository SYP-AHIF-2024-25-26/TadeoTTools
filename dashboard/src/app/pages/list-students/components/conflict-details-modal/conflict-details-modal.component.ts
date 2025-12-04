import { Component, inject, input, output } from '@angular/core';
import { Status, Student } from '../../../../types';
import { StudentService } from '../../../../student.service';

@Component({
  selector: 'app-conflict-details-modal',
  standalone: true,
  templateUrl: './conflict-details-modal.component.html',
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
        return 'text-green-500 font-bold';
      case Status.Declined:
        return 'text-red-500 font-bold';
      default:
        return 'text-yellow-500 font-bold';
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
