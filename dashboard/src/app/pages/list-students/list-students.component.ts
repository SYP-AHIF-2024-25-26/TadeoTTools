import {Component, computed, inject, signal, WritableSignal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Status, Student } from '../../types';
import { StudentStore } from '../../store/student.store';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../student.service';

@Component({
  selector: 'app-list-students',
  imports: [FormsModule, CommonModule],
  templateUrl: './list-students.component.html',
  standalone: true,
})
export class ListStudentsComponent {
  private studentStore = inject(StudentStore);
  private studentService = inject(StudentService);

  // Property to store the selected CSV file
  selectedFile: WritableSignal<File | null> = signal(null);

  // Filter and search state
  conflictsClassFilter = signal<string>('');
  conflictsStopFilter = signal<string>('');
  conflictsSearchTerm = signal<string>('');

  singleAssignmentsClassFilter = signal<string>('');
  singleAssignmentsStopFilter = signal<string>('');
  singleAssignmentsSearchTerm = signal<string>('');

  noAssignmentsClassFilter = signal<string>('');
  noAssignmentsSearchTerm = signal<string>('');

  // Selected student for conflict details
  selectedStudent = signal<Student | null>(null);

  // Get unique class names for filter dropdowns
  uniqueClasses = computed(() => {
    const classes = new Set<string>();
    this.studentStore.students().forEach(student => {
      classes.add(student.studentClass);
    });
    return Array.from(classes).sort();
  });

  // Get unique stop names for filter dropdowns
  uniqueStops = computed(() => {
    const stops = new Set<string>();
    this.studentStore.students().forEach(student => {
      student.studentAssignments.forEach(assignment => {
        stops.add(assignment.stopName);
      });
    });
    return Array.from(stops).sort();
  });

  // all where there is more than one assignment and at least one is pending
  conflicts = computed(() => {
    let filtered = this.studentStore.students().filter(
      (s) => s.studentAssignments.length > 1
    );

    // Apply class filter
    if (this.conflictsClassFilter()) {
      filtered = filtered.filter(s => s.studentClass === this.conflictsClassFilter());
    }

    // Apply stop filter
    if (this.conflictsStopFilter()) {
      filtered = filtered.filter(s =>
        s.studentAssignments.some(a => a.stopName === this.conflictsStopFilter())
      );
    }

    // Apply search
    if (this.conflictsSearchTerm()) {
      const term = this.conflictsSearchTerm().toLowerCase();
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.edufsUsername.toLowerCase().includes(term)
      );
    }

    return filtered;
  });

  // all where there is only one assignment and that one is pending
  singleAssignments = computed(() => {
    let filtered = this.studentStore.students().filter(
      (s) => s.studentAssignments.length === 1
    );

    // Apply class filter
    if (this.singleAssignmentsClassFilter()) {
      filtered = filtered.filter(s => s.studentClass === this.singleAssignmentsClassFilter());
    }

    // Apply stop filter
    if (this.singleAssignmentsStopFilter()) {
      filtered = filtered.filter(s =>
        s.studentAssignments.some(a => a.stopName === this.singleAssignmentsStopFilter())
      );
    }

    // Apply search
    if (this.singleAssignmentsSearchTerm()) {
      const term = this.singleAssignmentsSearchTerm().toLowerCase();
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.edufsUsername.toLowerCase().includes(term)
      );
    }

    return filtered;
  });

  // all where there is no assignment
  noAssignments = computed(() => {
    let filtered = this.studentStore.students().filter((s) => s.studentAssignments.length === 0);

    // Apply class filter
    if (this.noAssignmentsClassFilter()) {
      filtered = filtered.filter(s => s.studentClass === this.noAssignmentsClassFilter());
    }

    // Apply search
    if (this.noAssignmentsSearchTerm()) {
      const term = this.noAssignmentsSearchTerm().toLowerCase();
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.edufsUsername.toLowerCase().includes(term)
      );
    }

    return filtered;
  });

  async deleteAssignment(student: Student, index: number) {
    student.studentAssignments.splice(index, 1);
    return this.studentStore.updateStudent(student);
  }

  async changeAssignmentStatus(student: Student, index: number, status: Status) {
    student.studentAssignments[index].status = status;
    await this.studentStore.updateStudent(student);
  }

  async autoApproveAll(): Promise<void> {
    for (const student of this.singleAssignments()) {
      await this.changeAssignmentStatus(student, 0, Status.Accepted);
    }
  }

  async approveSingleAssignment(student: Student): Promise<void> {
    await this.changeAssignmentStatus(student, 0, Status.Accepted);
  }

  showConflictDetails(student: Student): void {
    this.selectedStudent.set(student);
  }

  closeConflictDetails(): void {
    this.selectedStudent.set(null);
  }

  async approveAssignment(student: Student, assignmentIndex: number): Promise<void> {
    await this.changeAssignmentStatus(student, assignmentIndex, Status.Accepted);
  }

  async rejectAssignment(student: Student, assignmentIndex: number): Promise<void> {
    await this.changeAssignmentStatus(student, assignmentIndex, Status.Declined);
  }

  async undoAssignment(student: Student, assignmentIndex: number): Promise<void> {
    await this.changeAssignmentStatus(student, assignmentIndex, Status.Pending);
  }

  getStatusClass(status: Status): string {
    switch (status) {
      case Status.Accepted:
        return 'text-success font-bold';
      case Status.Declined:
        return 'text-error font-bold';
      default:
        return 'text-black font-bold';
    }
  }

  getStatusText(status: Status): string {
    switch (status) {
      case Status.Accepted:
        return 'Accepted';
      case Status.Declined:
        return 'Declined';
      default:
        return 'Pending';
    }
  }

  protected readonly Status = Status;

  async rejectSingleAssignment(student: Student) {
    await this.changeAssignmentStatus(student, 0, Status.Declined);
  }

  async undoSingleAssignment(student: Student) {
    await this.changeAssignmentStatus(student, 0, Status.Pending);
  }

  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  // Submit the CSV file to the backend
  async submitStudentsCsv(): Promise<void> {
    if (!this.selectedFile) {
      alert('Please select a CSV file first');
      return;
    }

    try {
      await this.studentService.uploadStudentsCsv(this.selectedFile() as File);
      // Refresh the student list after successful upload
      location.reload();
    } catch (error) {
      console.error('Error uploading CSV:', error);
    }
  }
}
