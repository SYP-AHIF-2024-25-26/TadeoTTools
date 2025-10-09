import {
  Component,
  computed,
  inject,
  signal,
  ViewContainerRef
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Status, Stop, Student, StudentAssignment} from '../../types';
import {CommonModule} from '@angular/common';
import { sortStudents } from '../../utilfunctions';
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

  // Filter and search state
  conflictsClassFilter = signal<string>('');
  conflictsStopFilter = signal<string>('');
  conflictsSearchTerm = signal<string>('');


  // Fused (Single + No Requests)
  fusedClassFilter = signal<string>('');
  fusedDepartmentFilter = signal<string>('');
  fusedStopFilter = signal<string>('');
  fusedSearchTerm = signal<string>('');
  fusedStatusFilter = signal<string>('all');

  selectedStudent = signal<Student | null>(null);
  stops = signal<Stop[]>([]);
  students = signal<Student[]>([]);

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

  // Unique classes for fused section; if department is 'inf', only show HIF classes
  fusedUniqueClasses = computed(() => {
    const classes = new Set<string>();
    this.students().forEach(student => {
      classes.add(student.studentClass);
    });
    let arr = Array.from(classes).sort();
    const dep = this.fusedDepartmentFilter()?.toLowerCase();
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

  // all where there is more than one assignment and at least one is pending
  conflicts = computed(() => {
    let filtered = this.students().filter(
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

    return sortStudents(filtered) as Student[];
  });


  // Fused list: students with 0 or 1 assignment
  fusedAssignments = computed(() => {
    let filtered = this.students()
      .filter(s => s.studentAssignments.length <= 1)
      .map(student => ({
        ...student,
        showStops: false,
        selectedStops: new Set<number>()
      } as StudentWithUI));

    // Department filter
    if (this.fusedDepartmentFilter()) {
      filtered = filtered.filter(s => s.department === this.fusedDepartmentFilter());
    }

    // Class filter
    if (this.fusedClassFilter()) {
      filtered = filtered.filter(s => s.studentClass === this.fusedClassFilter());
    }

    // Stop filter (only meaningful for assigned students)
    if (this.fusedStopFilter()) {
      filtered = filtered.filter(s =>
        s.studentAssignments.length === 1 &&
        s.studentAssignments[0].stopName === this.fusedStopFilter()
      );
    }

    // Status filter
    const status = this.fusedStatusFilter();
    if (status && status !== 'all') {
      filtered = filtered.filter(s => {
        if (status === 'unassigned') return s.studentAssignments.length === 0;
        if (s.studentAssignments.length === 0) return false;
        const st = s.studentAssignments[0].status;
        if (status === 'pending') return st === Status.Pending;
        if (status === 'approved') return st === Status.Accepted;
        if (status === 'rejected') return st === Status.Declined;
        return true;
      });
    }

    // Search
    if (this.fusedSearchTerm()) {
      const term = this.fusedSearchTerm().toLowerCase();
      filtered = filtered.filter(s =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.edufsUsername.toLowerCase().includes(term)
      );
    }

    return sortStudents(filtered) as StudentWithUI[];
  });

  // Whether there is any requested (Pending) assignment in the currently visible fused list
  hasFusedRequested = computed(() => {
    return this.fusedAssignments().some(s => s.studentAssignments.length === 1 && s.studentAssignments[0].status === Status.Pending);
  });

  // Approve all currently requested (Pending) students visible in the fused list
  async approveAllRequestedInFused(): Promise<void> {
    const candidates = this.fusedAssignments().filter(s => s.studentAssignments.length === 1 && s.studentAssignments[0].status === Status.Pending);
    if (candidates.length === 0) return;
    await Promise.all(candidates.map(async s => {
      s.studentAssignments[0].status = Status.Accepted;
      await this.studentService.updateStudent(s);
    }));
  }


  async deleteAssignment(student: Student, index: number) {
    student.studentAssignments.splice(index, 1);
    return this.studentService.updateStudent(student);
  }

  async changeAssignmentStatus(student: Student, index: number, status: Status) {
    student.studentAssignments[index].status = status;
    await this.studentService.updateStudent(student);
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

  getFusedStatusText(student: Student): string {
    if (student.studentAssignments.length === 0) return 'Unassigned';
    return this.getStatusText(student.studentAssignments[0].status);
  }

  getFusedStatusClass(student: Student): string {
    if (student.studentAssignments.length === 0) return 'text-gray-500 font-bold';
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
}
