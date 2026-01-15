import {
  Component,
  computed,
  inject,
  signal,
  input,
  ViewContainerRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Status,
  Stop,
  Student,
  StudentAssignment,
} from '@/shared/models/types';
import { CommonModule } from '@angular/common';
import { sortStudents, downloadFile } from '@/shared/utils/utils';
import { StopService } from '@/core/services/stop.service';
import {
  Overlay,
  OverlayPositionBuilder,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { StopsPopupComponent } from '@/shared/modals/stop-selection-modal/stop-selection-modal.component';
import { StudentService } from '@/core/services/student.service';
import { StudentFiltersComponent } from './components/student-filters/student-filters.component';
import { StudentImportExportComponent } from './components/student-import-export/student-import-export.component';
import { AddStudentDialogComponent } from './components/add-student-dialog/add-student-dialog.component';
import { ConflictDetailsModalComponent } from './components/conflict-details-modal/conflict-details-modal.component';

export interface StudentWithUI extends Student {
  showStops?: boolean;
  selectedStops?: Set<number>;
}

@Component({
  selector: 'app-list-students',
  imports: [
    FormsModule,
    CommonModule,
    StudentFiltersComponent,
    StudentImportExportComponent,
    AddStudentDialogComponent,
    ConflictDetailsModalComponent,
  ],
  templateUrl: './student-list.component.html',
  standalone: true,
})
export class ListStudentsComponent {
  private stopService = inject(StopService);
  private studentService = inject(StudentService);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private positionBuilder = inject(OverlayPositionBuilder);

  classFilter = signal<string>('');
  departmentFilter = signal<string>('');
  stopFilter = signal<string>('');
  searchTerm = signal<string>('');
  statusFilter = signal<string>('all');

  selectedStudent = signal<Student | null>(null);
  stops = signal<Stop[]>([]);
  students = signal<Student[]>([]);

  showAddStudent = signal<boolean>(false);
  dataCollapsed = signal<boolean>(true);
  readOnly = input<boolean>(false);

  private overlayRef: OverlayRef | null = null;
  popupStudent: StudentWithUI | null = null;
  protected readonly Status = Status;

  async ngOnInit() {
    this.stops.set(await this.stopService.getStops());
    await this.refreshStudents();
  }

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

  uniqueStops = computed(() => {
    const stops = new Set<string>();
    this.students().forEach((student) => {
      student.studentAssignments.forEach((assignment) => {
        stops.add(assignment.stopName);
      });
    });
    return Array.from(stops).sort();
  });

  uniqueDepartments = computed(() => {
    const deps = new Set<string>();
    this.students().forEach((s) => deps.add(s.department));
    return Array.from(deps).sort();
  });

  filteredUniqueClasses = computed(() => {
    const classes = new Set<string>();
    this.students().forEach((student) => {
      classes.add(student.studentClass);
    });
    let arr = Array.from(classes).sort();
    const dep = this.departmentFilter()?.toLowerCase();

    const departmentMap: Record<string, string> = {
      informatik: 'hif',
      medizintechnik: 'hbg',
      medientechnik: 'hitm',
      elektrotechnik: 'hel',
    };

    if (dep && departmentMap[dep]) {
      arr = arr.filter((c) => c?.toLowerCase().includes(departmentMap[dep]));
    }

    return arr;
  });

  filteredStudents = computed(() => {
    let filtered = this.students().map(
      (student) =>
        ({
          ...student,
          showStops: false,
          selectedStops: new Set<number>(),
        }) as StudentWithUI
    );

    filtered = this.filterByDepartment(filtered);
    filtered = this.filterByClass(filtered);
    filtered = this.filterByStop(filtered);
    filtered = this.filterByStatus(filtered);
    filtered = this.filterBySearch(filtered);

    return sortStudents(filtered) as StudentWithUI[];
  });

  private filterByDepartment(students: StudentWithUI[]): StudentWithUI[] {
    const filter = this.departmentFilter();
    return filter ? students.filter((s) => s.department === filter) : students;
  }

  private filterByClass(students: StudentWithUI[]): StudentWithUI[] {
    const filter = this.classFilter();
    return filter
      ? students.filter((s) => s.studentClass === filter)
      : students;
  }

  private filterByStop(students: StudentWithUI[]): StudentWithUI[] {
    const filter = this.stopFilter();
    return filter
      ? students.filter((s) =>
          s.studentAssignments.some((a) => a.stopName === filter)
        )
      : students;
  }

  private filterByStatus(students: StudentWithUI[]): StudentWithUI[] {
    const status = this.statusFilter();
    if (!status || status === 'all') return students;

    return students.filter((s) => {
      if (status === 'unassigned') return s.studentAssignments.length === 0;
      if (status === 'conflict') return s.studentAssignments.length > 1;
      if (s.studentAssignments.length === 0) return false;

      return s.studentAssignments.some((a) => {
        if (status === 'pending') return a.status === Status.Pending;
        if (status === 'approved') return a.status === Status.Accepted;
        if (status === 'rejected') return a.status === Status.Declined;
        return false;
      });
    });
  }

  private filterBySearch(students: StudentWithUI[]): StudentWithUI[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return students;

    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.edufsUsername.toLowerCase().includes(term)
    );
  }

  hasRequested = computed(() => {
    return this.filteredStudents().some((s) =>
      s.studentAssignments.some((a) => a.status === Status.Pending)
    );
  });

  async approveAllRequested(): Promise<void> {
    const updates: Promise<void>[] = [];

    for (const student of this.filteredStudents()) {
      const pendingAssignments = student.studentAssignments.filter(
        (a) => a.status === Status.Pending
      );
      if (pendingAssignments.length > 0) {
        pendingAssignments.forEach((a) => (a.status = Status.Accepted));
        updates.push(this.studentService.updateStudent(student));
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      await this.refreshStudents();
    }
  }

  openAddStudentDialog() {
    this.showAddStudent.set(true);
  }

  closeAddStudentDialog() {
    this.showAddStudent.set(false);
  }

  async deleteAssignment(student: Student, index: number) {
    student.studentAssignments.splice(index, 1);
    await this.studentService.updateStudent(student);
    await this.refreshStudents();
  }

  async changeAssignmentStatus(
    student: Student,
    index: number,
    status: Status
  ) {
    student.studentAssignments[index].status = status;
    await this.studentService.updateStudent(student);
    await this.refreshStudents();
  }

  async refreshStudents() {
    const students = await this.studentService.getStudents();
    students.forEach((student) => {
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

  async rejectSingleAssignment(student: Student) {
    await this.changeAssignmentStatus(student, 0, Status.Declined);
  }

  async undoSingleAssignment(student: Student) {
    await this.changeAssignmentStatus(student, 0, Status.Pending);
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
    if (student.studentAssignments.length === 0)
      return 'text-gray-500 font-bold';
    if (student.studentAssignments.length > 1)
      return 'text-orange-500 font-bold';
    return this.getStatusClass(student.studentAssignments[0].status);
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

    if (!student.studentAssignments) {
      student.studentAssignments = [];
    }

    const selectedStops = this.stops().filter((stop) =>
      student.selectedStops?.has(stop.id)
    );

    for (const stop of selectedStops) {
      const newAssignment: StudentAssignment = {
        edufsUsername: student.edufsUsername,
        stopId: stop.id,
        stopName: stop.name,
        status: Status.Pending,
      };
      student.studentAssignments.push(newAssignment);
    }

    await this.studentService.updateStudent(student);
    student.showStops = false;
    student.selectedStops?.clear();
    await this.refreshStudents();
  }

  openStopsPopup(student: StudentWithUI, anchor: HTMLElement) {
    this.closeStopsPopup();
    this.popupStudent = student;
    const positionStrategy = this.positionBuilder
      .flexibleConnectedTo(anchor)
      .withPositions([
        {
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
        },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
      ]);
    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    this.overlayRef.backdropClick().subscribe(() => this.closeStopsPopup());
    this.overlayRef.keydownEvents().subscribe((event: KeyboardEvent) => {
      if (event.key === 'Escape') this.closeStopsPopup();
    });
    const portal = new ComponentPortal(
      StopsPopupComponent,
      this.viewContainerRef
    );
    const compRef = this.overlayRef.attach(portal);
    compRef.instance.student = student;
    compRef.instance.allStops = this.stops();
    compRef.instance.cancel.subscribe(() => {
      this.closeStopsPopup();
      this.popupStudent?.selectedStops?.clear();
    });
    compRef.instance.apply.subscribe(async (stu: StudentWithUI) => {
      await this.applyStopSelections(stu);
      this.closeStopsPopup();
    });
    compRef.instance.stopToggle.subscribe(
      ({
        student,
        stop,
        checked,
      }: {
        student: StudentWithUI;
        stop: Stop;
        checked: boolean;
      }) => {
        this.onStopToggle(student, stop, checked);
      }
    );
  }

  closeStopsPopup() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.popupStudent = null;
  }
}
