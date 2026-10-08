import {
  Component,
  computed,
  inject,
  signal,
  ViewContainerRef,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Status,
  Stop,
  Student,
  StudentAssignment,
} from '@/shared/models/types';
import { CommonModule } from '@angular/common';
import { sortStudents, downloadFile, plural } from '@/shared/utils/utils';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
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
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import {
  activeAssignments,
  CONFLICT_TEXT_CLASS,
  isConflict,
  primaryAssignmentIndex,
  statusText,
  statusTextClass,
  UNASSIGNED_TEXT_CLASS,
} from '@/shared/utils/assignment-status';

const STATUS_FILTERS = [
  'unassigned',
  'conflict',
  'pending',
  'approved',
  'rejected',
];

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
    DeletePopupComponent,
  ],
  templateUrl: './student-list.component.html',
})
export class ListStudentsComponent implements OnInit {
  private stopService = inject(StopService);
  private studentService = inject(StudentService);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private positionBuilder = inject(OverlayPositionBuilder);
  private scrollService = inject(ScrollPersistenceService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

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

  private overlayRef: OverlayRef | null = null;
  popupStudent: StudentWithUI | null = null;
  protected readonly Status = Status;

  async ngOnInit() {
    // The overview links here with ?status=conflict etc.
    const status = this.route.snapshot.queryParamMap.get('status');
    if (status && STATUS_FILTERS.includes(status)) {
      this.statusFilter.set(status);
    }
    this.stops.set(await this.stopService.getStops());
    await this.refreshStudents();
    this.scrollService.restoreScroll();
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
      // Old rejected requests don't count, as on the overview.
      if (status === 'unassigned')
        return activeAssignments(s.studentAssignments).length === 0;
      if (status === 'conflict') return isConflict(s.studentAssignments);
      if (s.studentAssignments.length === 0) return false;

      return s.studentAssignments.some((a) => {
        if (status === 'pending') return a.status === Status.Pending;
        if (status === 'approved') return a.status === Status.Accepted;
        // Requests rejected before duplicates were deleted instead.
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

  private hasPending(student: Student): boolean {
    return activeAssignments(student.studentAssignments).some(
      (a) => a.status === Status.Pending
    );
  }

  // Students with conflicting requests are left for manual resolution.
  approvableStudents = computed(() =>
    this.filteredStudents().filter(
      (s) => this.hasPending(s) && !isConflict(s.studentAssignments)
    )
  );

  skippedConflicts = computed(
    () =>
      this.filteredStudents().filter(
        (s) => this.hasPending(s) && isConflict(s.studentAssignments)
      ).length
  );

  // Approved students per stop, shown in the conflict dialog.
  approvedCountByStop = computed(() => {
    const counts = new Map<number, number>();
    for (const student of this.students()) {
      for (const a of student.studentAssignments) {
        if (a.status === Status.Accepted) {
          counts.set(a.stopId, (counts.get(a.stopId) ?? 0) + 1);
        }
      }
    }
    return counts;
  });

  hasRequested = computed(() => this.approvableStudents().length > 0);

  showApproveAllConfirm = signal<boolean>(false);
  approving = signal<boolean>(false);
  approveError = signal<string | null>(null);

  approveAllMessage = computed(() => {
    const count = this.approvableStudents().length;
    const skipped = this.skippedConflicts();
    return (
      `${plural(count, 'pending request')} in the current filter will be approved.` +
      (skipped > 0
        ? `\n${plural(skipped, 'student')} with conflicting requests ` +
          `${skipped === 1 ? 'is' : 'are'} skipped. Resolve ${skipped === 1 ? 'it' : 'them'} with "Manage Conflict".`
        : '')
    );
  });

  async approveAllRequested(): Promise<void> {
    this.approving.set(true);
    this.approveError.set(null);
    try {
      await Promise.all(
        this.approvableStudents().map((student) =>
          this.studentService.updateStudent({
            ...student,
            studentAssignments: student.studentAssignments.map((a) =>
              a.status === Status.Pending
                ? { ...a, status: Status.Accepted }
                : a
            ),
          })
        )
      );
    } catch (error) {
      console.error('Failed to approve requests', error);
      this.approveError.set(
        'Some requests could not be approved. The list shows the current state, please try again.'
      );
    } finally {
      // Close the dialog even if refreshing the list fails.
      try {
        await this.refreshStudents();
      } finally {
        this.approving.set(false);
        this.showApproveAllConfirm.set(false);
      }
    }
  }

  openAddStudentDialog() {
    this.showAddStudent.set(true);
  }

  closeAddStudentDialog() {
    this.showAddStudent.set(false);
  }

  busyStudents = signal<ReadonlySet<string>>(new Set());

  isBusy(student: Student): boolean {
    return this.busyStudents().has(student.edufsUsername);
  }

  private setBusy(student: Student, busy: boolean) {
    this.busyStudents.update((current) => {
      const next = new Set(current);
      if (busy) next.add(student.edufsUsername);
      else next.delete(student.edufsUsername);
      return next;
    });
  }

  // Saves a student's assignments. The row is disabled meanwhile, and the
  // list reloads afterwards so it shows what the server stored.
  private async saveAssignments(
    student: Student,
    assignments: StudentAssignment[],
    success?: string,
    undoTo?: StudentAssignment[]
  ): Promise<void> {
    if (this.isBusy(student)) return;
    this.setBusy(student, true);
    try {
      await this.studentService.updateStudent({
        ...student,
        studentAssignments: assignments,
      });
      if (success) {
        this.toast.success(
          success,
          undoTo
            ? {
                label: 'Undo',
                run: () => this.saveAssignments(student, undoTo),
              }
            : undefined
        );
      }
    } catch (error) {
      console.error('Failed to save assignments', error);
      this.toast.error(
        errorText(
          error,
          `The assignments of ${student.firstName} ${student.lastName} could not be saved. Please try again.`
        )
      );
    } finally {
      this.setBusy(student, false);
      await this.refreshStudents().catch((error) =>
        console.error('Failed to reload students', error)
      );
    }
  }

  async deleteAssignment(student: Student, index: number) {
    const previous = student.studentAssignments.map((a) => ({ ...a }));
    const removed = previous[index];
    await this.saveAssignments(
      student,
      previous.filter((_, i) => i !== index),
      `${student.firstName} ${student.lastName} removed from ${removed.stopName}.`,
      previous
    );
  }

  async changeAssignmentStatus(
    student: Student,
    index: number,
    status: Status
  ) {
    await this.saveAssignments(
      student,
      student.studentAssignments.map((a, i) =>
        i === index ? { ...a, status } : { ...a }
      )
    );
  }

  // Resolves a conflict in one step: approve this stop and delete the other
  // requests. Duplicate requests are deleted rather than rejected; Undo
  // restores them.
  async assignHere(student: Student, index: number) {
    const previous = student.studentAssignments.map((a) => ({ ...a }));
    const stop = previous[index];
    await this.saveAssignments(
      student,
      [{ ...stop, status: Status.Accepted }],
      `${student.firstName} ${student.lastName} assigned to ${stop.stopName}; other requests removed.`,
      previous
    );
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

    const selected = this.selectedStudent();
    if (selected) {
      const fresh = students.find(
        (s) => s.edufsUsername === selected.edufsUsername
      );
      this.selectedStudent.set(
        fresh && isConflict(fresh.studentAssignments) ? fresh : null
      );
    }
  }

  async approveSingleAssignment(student: Student): Promise<void> {
    await this.changeAssignmentStatus(
      student,
      primaryAssignmentIndex(student.studentAssignments),
      Status.Accepted
    );
  }

  showConflictDetails(student: Student): void {
    this.selectedStudent.set(student);
  }

  closeConflictDetails(): void {
    this.selectedStudent.set(null);
  }

  async undoSingleAssignment(student: Student) {
    await this.changeAssignmentStatus(
      student,
      primaryAssignmentIndex(student.studentAssignments),
      Status.Pending
    );
  }

  getStatusClass(status: Status): string {
    return statusTextClass(status);
  }

  getStatusText(status: Status): string {
    return statusText(status);
  }

  // With the "Rejected" filter, each row shows and acts on the student's old
  // rejected request, so Remove deletes exactly that one.
  private showsRejected = computed(() => this.statusFilter() === 'rejected');

  isConflictStudent(student: Student): boolean {
    return !this.showsRejected() && isConflict(student.studentAssignments);
  }

  primaryIndex(student: Student): number {
    if (this.showsRejected()) {
      const rejected = student.studentAssignments.findIndex(
        (a) => a.status === Status.Declined
      );
      if (rejected >= 0) return rejected;
    }
    return primaryAssignmentIndex(student.studentAssignments);
  }

  activeCount(student: Student): number {
    return activeAssignments(student.studentAssignments).length;
  }

  getStudentStatusText(student: Student): string {
    if (student.studentAssignments.length === 0) return 'Unassigned';
    if (this.isConflictStudent(student)) return 'Conflict';
    return statusText(
      student.studentAssignments[this.primaryIndex(student)].status
    );
  }

  getStudentStatusClass(student: Student): string {
    if (student.studentAssignments.length === 0) return UNASSIGNED_TEXT_CLASS;
    if (this.isConflictStudent(student)) return CONFLICT_TEXT_CLASS;
    return statusTextClass(
      student.studentAssignments[this.primaryIndex(student)].status
    );
  }

  onStopToggle(student: StudentWithUI, stop: Stop, checked: boolean): void {
    if (checked) {
      // One stop per student; picking another replaces the choice.
      student.selectedStops?.clear();
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
    compRef.setInput('student', student);
    compRef.setInput('allStops', this.stops());
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
