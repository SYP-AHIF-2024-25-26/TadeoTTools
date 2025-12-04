import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Student } from '../../../../../shared/models/types';
import { StudentService } from '../../../../../core/services/student.service';

@Component({
  selector: 'app-add-student-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-student-dialog.component.html',
})
export class AddStudentDialogComponent {
  private studentService = inject(StudentService);

  readonly uniqueDepartments = input.required<string[]>();
  readonly close = output<void>();
  readonly studentAdded = output<void>();

  addStudentError = signal<string | null>(null);

  newStudent: Student = {
    edufsUsername: '',
    firstName: '',
    lastName: '',
    studentClass: '',
    department: '',
    studentAssignments: [],
  };

  async saveNewStudent() {
    const s = this.newStudent;
    // minimal validation
    if (
      !s.edufsUsername ||
      !s.firstName ||
      !s.lastName ||
      !s.studentClass ||
      !s.department
    ) {
      return;
    }
    // ensure no stops are sent initially
    s.studentAssignments = [];
    try {
      await this.studentService.createStudent(s);
      this.studentAdded.emit();
      this.close.emit();
    } catch (err: any) {
      // Try to extract a meaningful backend error message
      let message = 'Failed to create student. Please try again.';
      const e = err?.error ?? err;
      if (e) {
        if (typeof e === 'string') {
          message = e;
        } else if (
          typeof e?.message === 'string' &&
          e.message.trim().length > 0
        ) {
          message = e.message;
        } else if (
          typeof err?.message === 'string' &&
          err.message.trim().length > 0
        ) {
          message = err.message;
        }
      }
      this.addStudentError.set(message);
    }
  }
}
