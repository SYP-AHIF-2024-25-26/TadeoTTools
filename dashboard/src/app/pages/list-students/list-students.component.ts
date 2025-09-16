import {Component, computed, inject, signal, HostListener} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Status, Student, Stop, StudentAssignment} from '../../types';
import {StudentStore} from '../../store/student.store';
import {CommonModule} from '@angular/common';
import {ChipComponent} from '../../standard-components/chip/chip.component';
import { StopStore } from '../../store/stop.store';

interface StudentWithUI extends Student {
  showStops?: boolean;
  selectedStops?: Set<number>;
}

@Component({
  selector: 'app-list-students',
  imports: [FormsModule, CommonModule, ChipComponent],
  templateUrl: './list-students.component.html',
  standalone: true,
})
export class ListStudentsComponent {
  private studentStore = inject(StudentStore);
  private stopStore = inject(StopStore);

  // Filter and search state
  conflictsClassFilter = signal<string>('');
  conflictsStopFilter = signal<string>('');
  conflictsSearchTerm = signal<string>('');

  singleAssignmentsClassFilter = signal<string>('');
  singleAssignmentsStopFilter = signal<string>('');
  singleAssignmentsSearchTerm = signal<string>('');
  singleAssignmentsStatusFilter = signal<string>('all');

  noAssignmentsClassFilter = signal<string>('');
  noAssignmentsSearchTerm = signal<string>('');
  noAssignmentsDepartmentFilter = signal<string[]>([]);

  // Selected student for conflict details
  selectedStudent = signal<Student | null>(null);

  allStops = computed(() => this.stopStore.getStops());

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

  uniqueDepartments = computed(() => {
    const deps = new Set<string>();
    this.studentStore.students().forEach(s => deps.add(s.department));
    return Array.from(deps).sort();
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

    if (this.singleAssignmentsStatusFilter() === 'approved') {
      filtered = filtered.filter(s => s.studentAssignments[0].status === Status.Accepted);
    } else if (this.singleAssignmentsStatusFilter() === 'rejected') {
      filtered = filtered.filter(s => s.studentAssignments[0].status !== Status.Accepted);
    }

    return filtered;
  });

  // all where there is no assignment
  noAssignments = computed(() => {
    let filtered = this.studentStore.students()
      .filter((s) => s.studentAssignments.length === 0)
      .map(student => ({
        ...student, 
        showStops: false,
        selectedStops: new Set<number>()
      } as StudentWithUI));

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

    if (this.noAssignmentsDepartmentFilter().length > 0) {
      filtered = filtered.filter(s => this.noAssignmentsDepartmentFilter().includes(s.department));
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

  onNoAssignmentsDepartmentSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    if (val && !this.noAssignmentsDepartmentFilter().includes(val)) {
      this.noAssignmentsDepartmentFilter.set([...this.noAssignmentsDepartmentFilter(), val]);
    }
    (event.target as HTMLSelectElement).value = '';
  }

  removeNoAssignmentsDepartment(value: string) {
    this.noAssignmentsDepartmentFilter.set(
      this.noAssignmentsDepartmentFilter().filter(v => v !== value)
    );
  }

  onStopSelect(student: StudentWithUI, stop: Stop, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    
    if (isChecked) {
      student.selectedStops?.add(stop.id);
    } else {
      student.selectedStops?.delete(stop.id);
    }
  }

  async applyStopSelections(student: StudentWithUI): Promise<void> {
    if (!student.selectedStops?.size) {
      return;
    }

    // Initialize assignments array if needed
    if (!student.studentAssignments) {
      student.studentAssignments = [];
    }

    // Get all selected stops
    const selectedStops = this.allStops().filter(stop => student.selectedStops?.has(stop.id));

    // Create assignments for all selected stops
    for (const stop of selectedStops) {
      const newAssignment: StudentAssignment = {
        studentId: student.edufsUsername,
        stopId: stop.id,
        stopName: stop.name,
        status: Status.Pending
      };
      student.studentAssignments.push(newAssignment);
    }

    // Update the student and close the popup
    await this.studentStore.updateStudent(student);
    student.showStops = false;
    student.selectedStops?.clear();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const noAssignmentsStudents = this.noAssignments();
    for (const student of noAssignmentsStudents) {
      if (student.showStops) {
        // Check if click is outside the popup and the toggle button
        const popup = document.querySelector(`[data-student-id="${student.edufsUsername}"] .stops-popup`);
        const button = document.querySelector(`[data-student-id="${student.edufsUsername}"] .toggle-stops-btn`);
        
        if (popup && button && 
            !popup.contains(event.target as Node) && 
            !button.contains(event.target as Node)) {
          student.showStops = false;
        }
      }
    }
  }

  isStopSelected(student: StudentWithUI, stopId: number): boolean {
    return student.selectedStops?.has(stopId) || false;
  }
}
