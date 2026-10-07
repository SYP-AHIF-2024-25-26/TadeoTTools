import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import {
  Status,
  Stop,
  Student,
  StudentAssignment,
} from '@/shared/models/types';
import { StudentService } from '@/core/services/student.service';
import { StopService } from '@/core/services/stop.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import {
  activeAssignments,
  CONFLICT_BADGE_CLASS,
  isConflict,
  statusBadgeClass,
  statusText,
} from '@/shared/utils/assignment-status';
import {
  csvBlob,
  downloadFile,
  fileSlug,
  sortStudents,
} from '@/shared/utils/utils';

// One pending or approved request at one of the manager's stops. A student
// with requests at two of these stops gets two rows. `others` holds the
// student's remaining requests, including other managers' stops, so conflicts
// stay visible.
type RequestRow = {
  student: Student;
  assignment: StudentAssignment;
  others: StudentAssignment[];
  conflict: boolean;
  searchText: string;
};

export type StatusFilter = 'all' | 'pending' | 'approved' | 'conflict';

type Removal = { student: Student; assignment: StudentAssignment };

@Component({
  selector: 'app-stop-manager-students',
  imports: [FormsModule, NgTemplateOutlet, DeletePopupComponent],
  templateUrl: './stop-manager-students.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopManagerStudentsComponent implements OnInit {
  private studentService = inject(StudentService);
  private stopService = inject(StopService);
  private toast = inject(ToastService);

  stopManagerId = input.required<string>();
  ownStops = input.required<Stop[]>();
  // Emitted after every successful load, so the page can summarise the stops.
  studentsLoaded = output<Student[]>();

  students = signal<Student[]>([]);
  loading = signal(true);
  loadFailed = signal(false);
  searchTerm = signal('');
  stopFilter = signal<number | null>(null);
  classFilter = signal('');
  statusFilter = signal<StatusFilter>('all');

  removal = signal<Removal | null>(null);
  removing = signal(false);

  protected readonly Status = Status;

  async ngOnInit() {
    await this.loadStudents();
  }

  async loadStudents() {
    this.loading.set(true);
    this.loadFailed.set(false);
    try {
      const students = await this.studentService.getStudentsForStopManager(
        this.stopManagerId()
      );
      this.students.set(students);
      this.studentsLoaded.emit(students);
    } catch (error) {
      console.error('Failed to load students of stop manager', error);
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  sortedStops = computed(() =>
    [...this.ownStops()].sort((a, b) => a.name.localeCompare(b.name))
  );

  private ownStopIds = computed(
    () => new Set(this.ownStops().map((stop) => stop.id))
  );

  private rows = computed<RequestRow[]>(() => {
    const own = this.ownStopIds();
    return sortStudents([...this.students()]).flatMap((student) => {
      const active = activeAssignments(student.studentAssignments ?? []);
      const conflict = isConflict(active);
      return active
        .filter((a) => own.has(a.stopId))
        .map((assignment) => {
          const others = active.filter((a) => a !== assignment);
          return {
            student,
            assignment,
            others,
            conflict,
            searchText: [
              student.firstName,
              student.lastName,
              `${student.firstName} ${student.lastName}`,
              `${student.lastName} ${student.firstName}`,
              student.edufsUsername,
              student.studentClass,
              student.department,
              assignment.stopName,
              ...others.flatMap((o) => [o.stopName, ...(o.stopManagers ?? [])]),
            ]
              .join(' | ')
              .toLowerCase(),
          };
        });
    });
  });

  classes = computed(() =>
    [...new Set(this.rows().map((r) => r.student.studentClass))].sort()
  );

  visibleRows = computed(() => {
    const stopId = this.stopFilter();
    const studentClass = this.classFilter();
    const status = this.statusFilter();
    const terms = this.searchTerm().toLowerCase().split(/\s+/).filter(Boolean);
    return this.rows().filter(
      (row) =>
        (stopId === null || row.assignment.stopId === stopId) &&
        (!studentClass || row.student.studentClass === studentClass) &&
        (status === 'all' ||
          (status === 'conflict' && row.conflict) ||
          (status === 'pending' &&
            !row.conflict &&
            row.assignment.status === Status.Pending) ||
          (status === 'approved' &&
            !row.conflict &&
            row.assignment.status === Status.Accepted)) &&
        terms.every((term) => row.searchText.includes(term))
    );
  });

  private countStudents(rows: RequestRow[]): number {
    return new Set(rows.map((r) => r.student.edufsUsername)).size;
  }

  totalCount = computed(() => this.countStudents(this.rows()));
  visibleCount = computed(() => this.countStudents(this.visibleRows()));

  filtersActive = computed(
    () =>
      this.searchTerm() !== '' ||
      this.stopFilter() !== null ||
      this.classFilter() !== '' ||
      this.statusFilter() !== 'all'
  );

  clearFilters() {
    this.searchTerm.set('');
    this.stopFilter.set(null);
    this.classFilter.set('');
    this.statusFilter.set('all');
  }

  filterStopName = computed(
    () => this.ownStops().find((s) => s.id === this.stopFilter())?.name ?? ''
  );

  statusText = statusText;

  // A student with more than one open request shows as Conflict on every row,
  // whatever the status of the single request.
  rowStatusText(row: RequestRow): string {
    return row.conflict ? 'Conflict' : statusText(row.assignment.status);
  }

  rowStatusClass(row: RequestRow): string {
    return row.conflict
      ? CONFLICT_BADGE_CLASS
      : statusBadgeClass(row.assignment.status);
  }

  fullName(student: Student): string {
    return `${student.firstName} ${student.lastName}`;
  }

  // Exactly the rows shown, one line per request.
  exportCsv() {
    const lines = this.visibleRows().map((row) => {
      const { student, assignment, others } = row;
      return [
        student.lastName,
        student.firstName,
        student.studentClass,
        student.department,
        assignment.stopName,
        this.rowStatusText(row),
        others.map((o) => o.stopName).join(', '),
      ];
    });
    const header = [
      'Last name',
      'First name',
      'Class',
      'Department',
      'Stop',
      'Status',
      'Other requests',
    ];
    const name =
      this.stopFilter() === null ? 'my-stops' : fileSlug(this.filterStopName());
    downloadFile(csvBlob([header, ...lines]), `students_${name}.csv`);
  }

  // Requests that stay after removing the one in the dialog.
  private remaining = computed(() => {
    const removal = this.removal();
    if (!removal) return [];
    return activeAssignments(removal.student.studentAssignments).filter(
      (a) => a !== removal.assignment
    );
  });

  removalTitle = computed(() =>
    this.removal()?.assignment.status === Status.Accepted
      ? 'Remove from stop?'
      : 'Remove request?'
  );

  removalConfirmLabel = computed(() =>
    this.removal()?.assignment.status === Status.Accepted
      ? 'Remove from stop'
      : 'Remove request'
  );

  removalMessage = computed(() => {
    const removal = this.removal();
    if (!removal) return '';
    const name = this.fullName(removal.student);
    const stop = removal.assignment.stopName;
    const remaining = this.remaining().map((a) => a.stopName);
    const approved = removal.assignment.status === Status.Accepted;

    const lines = [
      approved
        ? `${name} is approved to work at ${stop}. Removing deletes this assignment. Only an admin can undo this.`
        : `The request for ${name} at ${stop} will be deleted. Only an admin can undo this.`,
    ];
    if (remaining.length === 1) {
      lines.push(
        `The request for ${remaining[0]} stays, so an admin no longer has to decide between the two.`
      );
    } else if (remaining.length > 1) {
      lines.push(
        `The requests for ${remaining.join(', ')} stay; an admin still decides between them.`
      );
    } else if (approved) {
      lines.push(
        `${name} will then have no stop on open day unless an admin assigns one.`
      );
    }
    return lines.join('\n');
  });

  askRemove(student: Student, assignment: StudentAssignment) {
    this.removal.set({ student, assignment });
  }

  cancelRemove() {
    this.removal.set(null);
  }

  // Stop managers save through the stop: load its current requests, drop this
  // one and send the rest back, as the stop editor does.
  async confirmRemove() {
    const removal = this.removal();
    if (!removal) return;
    const { student, assignment } = removal;
    this.removing.set(true);
    try {
      const stop = await this.stopService.getStopById(assignment.stopId);
      if (!stop) throw new Error(`Stop ${assignment.stopId} not found`);
      const username = student.edufsUsername.toLowerCase();
      await this.stopService.updateStopAsStopManager({
        id: stop.id,
        name: stop.name,
        roomNr: stop.roomNr,
        description: stop.description,
        infrastructure: stop.infrastructure,
        studentAssignments: (stop.studentAssignments ?? []).filter(
          (a) => a.edufsUsername.toLowerCase() !== username
        ),
      });
      this.toast.success(
        `${this.fullName(student)} removed from ${assignment.stopName}.`
      );
    } catch (error) {
      console.error('Failed to remove request', error);
      this.toast.error(
        errorText(
          error,
          `${this.fullName(student)} could not be removed from ${assignment.stopName}. Please try again.`
        )
      );
    } finally {
      this.removing.set(false);
      this.removal.set(null);
      await this.loadStudents();
    }
  }
}
