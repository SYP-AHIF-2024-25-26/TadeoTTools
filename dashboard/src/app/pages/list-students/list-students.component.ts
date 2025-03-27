import {Component, computed, inject} from '@angular/core';
import {Status, Student} from '../../types';
import {StudentStore} from "../../store/student.store";

@Component({
  selector: 'app-list-students',
  imports: [],
  templateUrl: './list-students.component.html',
  standalone: true
})
export class ListStudentsComponent {
  private studentStore = inject(StudentStore);

  // all where there is more than one assignment and at least one is pending
  conflicts = computed(() =>
    this.studentStore.students().filter(
      (s) =>
        s.studentAssignments.some((a) => a.status === Status.Pending)
        && s.studentAssignments.length > 1
    )
  );

  // all where there is only one assignment and that one is pending
  singleAssignments = computed(() =>
    this.studentStore.students().filter(
      (s) =>
        s.studentAssignments.length === 1 &&
        s.studentAssignments[0].status === Status.Pending
    )
  );

  // all where there is no assignment
  noAssignments = computed(() =>
    this.studentStore.students().filter((s) => s.studentAssignments.length === 0)
  );

  async changeAssignmentStatus(student: Student, index: number, status: Status) {
    student.studentAssignments[index].status = status;
    await this.studentStore.updateStudent(student);
  }

  async autoApproveAll(): Promise<Promise<void>> {
    this.singleAssignments().forEach((student) => {
      this.changeAssignmentStatus(student, 0, Status.Accepted);
    });
  }

  protected readonly Status = Status;
}
