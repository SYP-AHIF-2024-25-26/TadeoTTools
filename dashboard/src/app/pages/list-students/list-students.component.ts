import { Component, computed, inject, signal, ViewContainerRef, WritableSignal } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Status, Stop, Student, StudentAssignment} from '../../types';
import {CommonModule} from '@angular/common';
import { sortStudents, downloadFile } from '../../utilfunctions';
import { StopService } from '../../stop.service';
import {Overlay, OverlayPositionBuilder, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {StopsPopupComponent} from "../../popups/stops-popup/stops-popup.component";
import { StudentService } from '../../student.service';

export interface StudentWithUI extends Student {
  showStops?: boolean;
  selectedStops?: Set<number>;
}

@Component({
  selector: 'app-list-students',
  imports: [FormsModule, CommonModule],
  templateUrl: './list-students.component.html',
  standalone: true,
})
export class ListStudentsComponent {
  private stopService = inject(StopService);
  private studentService = inject(StudentService);

  selectedStudentFile: WritableSignal<File | null> = signal(null);

  // Unified filter and search state
  classFilter = signal<string>('');
  departmentFilter = signal<string>('');
  stopFilter = signal<string>('');
  searchTerm = signal<string>('');
  statusFilter = signal<string>('all');

  selectedStudent = signal<Student | null>(null);
  stops = signal<Stop[]>([]);
  students = signal<Student[]>([]);

  // Add-student modal state
  showAddStudent = signal<boolean>(false);
  addStudentError = signal<string | null>(null);
  newStudent: Student = {
    edufsUsername: '',
    firstName: '',
    lastName: '',
    studentClass: '',
    department: '',
    studentAssignments: []
  };

  // Collapsible data section state
  dataCollapsed = signal<boolean>(true);

  toggleDataCollapsed(): void {
    this.dataCollapsed.set(!this.dataCollapsed());
  }

  clearFilters(): void {
    this.classFilter.set('');
    this.departmentFilter.set('');
    this.stopFilter.set('');
    this.searchTerm.set('');
    this.statusFilter.set('all');
  }

  // Get unique class names for filter dropdowns
  uniqueClasses = computed(() => {
    const classes = new Set<string>();
    this.students().forEach(student => {
      classes.add(student.studentClass);
    });
    return Array.from(classes).sort();
  });

  async ngOnInit() {
    this.stops.set(await this.stopService.getStops());
    const students = await this.studentService.getStudents();

    // Sort assignments by stopId for each student
    students.forEach(student => {
      if (student.studentAssignments) {
        student.studentAssignments.sort((a, b) => a.stopId - b.stopId);
      } else {
        student.studentAssignments = [];
      }
    });

    this.students.set(students);
  }

  // Get unique stop names for filter dropdowns
  uniqueStops = computed(() => {
    const stops = new Set<string>();
    this.students().forEach(student => {
      student.studentAssignments.forEach(assignment => {
        stops.add(assignment.stopName);
      });
    });
    return Array.from(stops).sort();
  });

  uniqueDepartments = computed(() => {
    const deps = new Set<string>();
    this.students().forEach(s => deps.add(s.department));
    return Array.from(deps).sort();
  });

  // Remove the old fusedUniqueClasses and add unified version
  filteredUniqueClasses = computed(() => {
    const classes = new Set<string>();
    this.students().forEach(student => {
      classes.add(student.studentClass);
    });
    let arr = Array.from(classes).sort();
    const dep = this.departmentFilter()?.toLowerCase();
    switch (dep) {
      case 'informatik':
        arr = arr.filter(c => c?.toLowerCase().includes('hif'));
        break;
      case 'medizintechnik':
        arr = arr.filter(c => c?.toLowerCase().includes('hbg'));
        break;
      case 'medientechnik':
        arr = arr.filter(c => c?.toLowerCase().includes('hitm'));
        break;
      case 'elektrotechnik':
        arr = arr.filter(c => c?.toLowerCase().includes('hel'));
        break;
      default:
        break;
    }
    return arr;
  });

  // Remove conflicts and fusedAssignments, replace with single unified list
  filteredStudents = computed(() => {
    let filtered = this.students().map(student => ({
      ...student,
      showStops: false,
      selectedStops: new Set<number>()
    } as StudentWithUI));

    // Department filter
    if (this.departmentFilter()) {
      filtered = filtered.filter(s => s.department === this.departmentFilter());
    }

    // Class filter
    if (this.classFilter()) {
      filtered = filtered.filter(s => s.studentClass === this.classFilter());
    }

    // Stop filter
    if (this.stopFilter()) {
      filtered = filtered.filter(s =>
        s.studentAssignments.some(a => a.stopName === this.stopFilter())
      );
    }

    // Status filter
    const status = this.statusFilter();
    if (status && status !== 'all') {
      filtered = filtered.filter(s => {
        if (status === 'unassigned') return s.studentAssignments.length === 0;
        if (status === 'conflict') return s.studentAssignments.length > 1;
        if (s.studentAssignments.length === 0) return false;
        const hasStatus = s.studentAssignments.some(a => {
          if (status === 'pending') return a.status === Status.Pending;
          if (status === 'approved') return a.status === Status.Accepted;
          if (status === 'rejected') return a.status === Status.Declined;
          return false;
        });
        return hasStatus;
      });
    }

    // Search
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.edufsUsername.toLowerCase().includes(term)
      );
    }

    return sortStudents(filtered) as StudentWithUI[];
  });

  // Whether there is any requested (Pending) assignment in the currently visible list
  hasRequested = computed(() => {
    return this.filteredStudents().some(s =>
      s.studentAssignments.some(a => a.status === Status.Pending)
    );
  });

  onStudentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedStudentFile.set(input.files[0]);
    }
  }

  async submitStudentsCsv(): Promise<void> {
    if (!this.selectedStudentFile) {
      alert('Please select a CSV file first');
      return;
    }

    try {
      await this.studentService.uploadStudentsCsv(this.selectedStudentFile() as File);
      location.reload();
    } catch (error) {
      console.error('Error uploading CSV:', error);
    }
  }

  async downloadStudentsData() {
    try {
      const blob = await this.studentService.getStudentsDataFile();
      downloadFile(blob, 'students_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download students data');
    }
  }

  // Approve all currently requested (Pending) students visible in the list
  async approveAllRequested(): Promise<void> {
    const updates: Promise<void>[] = [];

    for (const student of this.filteredStudents()) {
      const pendingAssignments = student.studentAssignments.filter(a => a.status === Status.Pending);
      if (pendingAssignments.length > 0) {
        pendingAssignments.forEach(a => a.status = Status.Accepted);
        updates.push(this.studentService.updateStudent(student));
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      await this.refreshStudents();
    }
  }

  openAddStudentDialog() {
    this.newStudent = {
      edufsUsername: '',
      firstName: '',
      lastName: '',
      studentClass: '',
      department: '',
      studentAssignments: []
    };
    this.addStudentError.set(null);
    this.showAddStudent.set(true);
  }

  closeAddStudentDialog() {
    this.addStudentError.set(null);
    this.showAddStudent.set(false);
  }

  async saveNewStudent() {
    const s = this.newStudent;
    // minimal validation
    if (!s.edufsUsername || !s.firstName || !s.lastName || !s.studentClass || !s.department) {
      return;
    }
    // ensure no stops are sent initially
    s.studentAssignments = [];
    try {
      await this.studentService.createStudent(s);
      await this.refreshStudents();
      this.showAddStudent.set(false);
      this.addStudentError.set(null);
    } catch (err: any) {
      // Try to extract a meaningful backend error message
      let message = 'Failed to create student. Please try again.';
      const e = err?.error ?? err;
      if (e) {
        if (typeof e === 'string') {
          message = e;
        } else if (typeof e?.message === 'string' && e.message.trim().length > 0) {
          message = e.message;
        } else if (typeof err?.message === 'string' && err.message.trim().length > 0) {
          message = err.message;
        }
      }
      this.addStudentError.set(message);
    }
  }

  async deleteAssignment(student: Student, index: number) {
    student.studentAssignments.splice(index, 1);
    await this.studentService.updateStudent(student);
    await this.refreshStudents();
  }

  async changeAssignmentStatus(student: Student, index: number, status: Status) {
    student.studentAssignments[index].status = status;
    await this.studentService.updateStudent(student);
    await this.refreshStudents();
  }

  async refreshStudents() {
    const students = await this.studentService.getStudents();

    // Sort assignments by stopId for each student
    students.forEach(student => {
      if (student.studentAssignments) {
        student.studentAssignments.sort((a, b) => a.stopId - b.stopId);
      } else {
        student.studentAssignments = [];
      }
    });

    this.students.set(students);
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

  getStudentStatusText(student: Student): string {
    if (student.studentAssignments.length === 0) return 'Unassigned';
    if (student.studentAssignments.length > 1) return 'Conflict';
    return this.getStatusText(student.studentAssignments[0].status);
  }

  getStudentStatusClass(student: Student): string {
    if (student.studentAssignments.length === 0) return 'text-gray-500 font-bold';
    if (student.studentAssignments.length > 1) return 'text-orange-500 font-bold';
    return this.getStatusClass(student.studentAssignments[0].status);
  }

  protected readonly Status = Status;

  async rejectSingleAssignment(student: Student) {
    await this.changeAssignmentStatus(student, 0, Status.Declined);
  }

  async undoSingleAssignment(student: Student) {
    await this.changeAssignmentStatus(student, 0, Status.Pending);
  }

  onStopToggle(student: StudentWithUI, stop: Stop, checked: boolean): void {
    if (checked) {
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
    const selectedStops = this.stops()
      .filter(stop => student.selectedStops?.has(stop.id));

    // Create assignments for all selected stops
    for (const stop of selectedStops) {
      const newAssignment: StudentAssignment = {
        edufsUsername: student.edufsUsername,
        stopId: stop.id,
        stopName: stop.name,
        status: Status.Pending
      };
      student.studentAssignments.push(newAssignment);
    }

    // Update the student and close the popup
    await this.studentService.updateStudent(student);
    student.showStops = false;
    student.selectedStops?.clear();
    await this.refreshStudents();
  }

  private overlayRef: OverlayRef | null = null;
  popupStudent: StudentWithUI | null = null;

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef,
    private positionBuilder: OverlayPositionBuilder
  ) {
  }

  openStopsPopup(student: StudentWithUI, anchor: HTMLElement) {
    this.closeStopsPopup();
    this.popupStudent = student;
    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(anchor)
      .withPositions([
        {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
        {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'}
      ]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition()
    });
    this.overlayRef.backdropClick().subscribe(() => this.closeStopsPopup());
    this.overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') this.closeStopsPopup();
    });
    const portal = new ComponentPortal(StopsPopupComponent, this.viewContainerRef);
    const compRef = this.overlayRef.attach(portal);
    compRef.instance.student = student;
    compRef.instance.allStops = this.stops();
    compRef.instance.cancel.subscribe(() => {
      this.closeStopsPopup();
      this.popupStudent?.selectedStops?.clear();
    });
    compRef.instance.apply.subscribe(async (stu) => {
      await this.applyStopSelections(stu);
      this.closeStopsPopup();
    });
    compRef.instance.stopToggle.subscribe(({student, stop, checked}) => {
      this.onStopToggle(student, stop, checked);
    });
  }

  closeStopsPopup() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.popupStudent = null;
  }

  exportFusedStudentsCSV(): void {
    const students = this.filteredStudents();

    let csvContent = 'Class;Lastname;Firstname;Status\n';

    students.forEach(student => {
      const status = this.getStudentStatusText(student);
      csvContent += `${student.studentClass};${student.lastName};${student.firstName};${status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(blob, `students_export_${timestamp}.csv`);
  }
}
