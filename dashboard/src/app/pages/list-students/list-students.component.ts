import { Component, inject, OnInit, signal } from '@angular/core';
import { StudentService } from '../../student.service';
import { Status, Student, StudentAssignment } from '../../types';

@Component({
  selector: 'app-list-students',
  imports: [],
  templateUrl: './list-students.component.html',
})
export class ListStudentsComponent implements OnInit {
  private service: StudentService = inject(StudentService);

  students = signal<Student[]>([]);
  conflicts = signal<Student[]>([]);
  singleAssignments = signal<Student[]>([]);
  noAssignments = signal<Student[]>([]);
  selectedAssignments: Map<string, number> = new Map();
  approvedSingles: Set<string> = new Set();

  async ngOnInit() {
    await this.fetchStudents();
  }

  async fetchStudents(): Promise<void> {
    this.students.set(await this.service.getStudents());
    this.processStudents();
  }

  processStudents(): void {
    // all where there is more than one assignment and at least one is pending
    this.conflicts.set(
      this.students().filter(
        (s) =>
          s.studentAssignments.filter((a) => a.status === Status.Pending)
            .length >= 1 && s.studentAssignments.length > 1
      )
    );
    // all where there is only one assingment and that one is pending
    this.singleAssignments.set(
      this.students().filter(
        (s) =>
          s.studentAssignments.length === 1 &&
          s.studentAssignments[0].status === Status.Pending
      )
    );
    // all where there are no assignments
    this.noAssignments.set(
      this.students().filter((s) => s.studentAssignments.length === 0)
    );
  }

  approveStudent(student: Student, index: number): void {
    student.studentAssignments[index].status = Status.Accepted;
    this.updateStudent(student);
  }

  undoStatus(student: Student, index: number): void {
    student.studentAssignments[index].status = Status.Pending;
    this.updateStudent(student);
  }

  rejectStudent(student: Student, index: number): void {
    student.studentAssignments[index].status = Status.Declined;
    this.updateStudent(student);
  }

  async autoApproveAll(): Promise<void> {
    this.singleAssignments().forEach((student) => {
      const assignment = student.studentAssignments.find(
        (a) => a.status === Status.Pending
      );
      if (assignment) this.approveStudent(student, 0);
    });
    await this.fetchStudents();
  }

  async updateStudent(student: Student): Promise<void> {
    await this.service.updateStudent(student);
    await this.fetchStudents();
  }
}
