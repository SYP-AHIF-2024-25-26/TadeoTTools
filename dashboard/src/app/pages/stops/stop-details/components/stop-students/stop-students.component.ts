import {
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Stop, Student, Status } from '@/shared/models/types';
import { sortStudents, downloadFile } from '@/shared/utils/utils';
import { StopService } from '@/core/services/stop.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { statusBadgeClass, statusText } from '@/shared/utils/assignment-status';

@Component({
  selector: 'app-stop-students',
  imports: [FormsModule],
  templateUrl: './stop-students.component.html',
})
export class StopStudentsComponent {
  private stopService = inject(StopService);
  private toast = inject(ToastService);

  stop = model.required<Stop>();
  students = input.required<Student[]>();

  assignedStudentFilterText = signal<string>('');
  availableStudentFilterText = signal<string>('');
  selectedAssignedClass = signal<string>('all');
  selectedAvailableClass = signal<string>('all');
  isExpanded = signal<boolean>(true);

  toggle() {
    this.isExpanded.update((v) => !v);
  }

  protected readonly Status = Status;

  availableClasses = computed(() => {
    const classes = this.students()
      .map((student) => student.studentClass)
      .sort();
    return ['all', ...new Set(classes)].filter(Boolean);
  });

  private applyStudentFilters(
    students: Student[],
    filterText: string,
    selectedClass: string
  ) {
    let filteredStudents = students;

    if (selectedClass !== 'all') {
      filteredStudents = filteredStudents.filter(
        (student) => student.studentClass === selectedClass
      );
    }

    if (filterText.trim() !== '') {
      const searchText = filterText.toLowerCase().trim();
      filteredStudents = filteredStudents.filter(
        (student) =>
          student.firstName.toLowerCase().includes(searchText) ||
          student.lastName.toLowerCase().includes(searchText) ||
          student.edufsUsername.toLowerCase().includes(searchText)
      );
    }

    return sortStudents(filteredStudents);
  }

  private fetchAssignedStudents() {
    return this.stop().studentAssignments
      ? this.stop()
          .studentAssignments.map((a) => {
            const student = this.students().find(
              (s) => s.edufsUsername === a.edufsUsername
            );
            if (student) {
              return {
                ...student,
                assignmentStatus: a.status,
              };
            }
            return undefined;
          })
          .filter(
            (s): s is Student & { assignmentStatus: Status } => s !== undefined
          )
      : [];
  }

  filteredAssignedStudents = computed(() => {
    const assignedStudents = this.fetchAssignedStudents();
    return sortStudents(
      this.applyStudentFilters(
        assignedStudents,
        this.assignedStudentFilterText(),
        this.selectedAssignedClass()
      )
    );
  });

  studentsNotInStop = computed(() => {
    const studentsInStop = this.fetchAssignedStudents();

    const studentsNotInStop = this.students().filter(
      (student) =>
        !studentsInStop.some((s) => s.edufsUsername === student.edufsUsername)
    );

    const filteredStudents = studentsNotInStop.filter((student) => {
      if (student.studentAssignments && student.studentAssignments.length > 0) {
        return !student.studentAssignments.some(
          (assignment) => assignment.status === Status.Accepted
        );
      }
      return true;
    });

    return sortStudents(
      this.applyStudentFilters(
        filteredStudents,
        this.availableStudentFilterText(),
        this.selectedAvailableClass()
      )
    );
  });

  onAssignedClassSelect($event: Event) {
    this.selectedAssignedClass.set(($event.target as HTMLSelectElement).value);
  }

  onAvailableClassSelect($event: Event) {
    this.selectedAvailableClass.set(($event.target as HTMLSelectElement).value);
  }

  async onStudentClick(edufsUsername: string) {
    this.stop.update((stop) => ({
      ...stop,
      studentAssignments: [
        ...(stop.studentAssignments || []),
        { edufsUsername, status: Status.Pending },
      ],
    }));
  }

  removeStudent(edufsUsername: string) {
    this.stop.update((stop) => ({
      ...stop,
      studentAssignments: (stop.studentAssignments || []).filter(
        (a) => a.edufsUsername !== edufsUsername
      ),
    }));
  }

  getAssignmentStatus(student: Student): Status {
    const assignment = this.stop().studentAssignments?.find(
      (a) => a.edufsUsername === student.edufsUsername
    );
    return assignment ? assignment.status : Status.Pending;
  }

  getStatusLabel(status: Status): string {
    return statusText(status);
  }

  getStatusClass(status: Status): string {
    return statusBadgeClass(status);
  }

  getStudentOtherAssignmentsCount(edufsUsername: string): number {
    const assignments = this.students()
      .find((s) => s.edufsUsername === edufsUsername)
      ?.studentAssignments.filter(
        (a) => a.stopId !== this.stop().id && a.status !== Status.Declined
      );
    return assignments ? assignments.length : 0;
  }

  hasOtherAssignments(edufsUsername: string): boolean {
    return this.getStudentOtherAssignmentsCount(edufsUsername) > 0;
  }

  async downloadStudentsOfStopData() {
    try {
      const blob = await this.stopService.getStopDataFile(this.stop().id);
      downloadFile(blob, 'students_of_stop_data.csv');
    } catch (error) {
      console.error('Failed to download students of stop', error);
      this.toast.error(
        errorText(error, 'The students of this stop could not be downloaded.')
      );
    }
  }
}
