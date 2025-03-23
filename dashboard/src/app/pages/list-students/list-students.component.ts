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
    console.log(this.students()[4].studentAssignments[0].status);
    console.log(Status.Pending);
    this.conflicts.set(this.students().filter(
      (s) =>
        s.studentAssignments.filter((a) => a.status - 1 === Status.Pending).length >
        1
    ));
    this.singleAssignments.set(this.students().filter(
      (s) =>
        s.studentAssignments.filter((a) => a.status - 1 === Status.Pending)
          .length === 1
    ));
    this.noAssignments.set(this.students().filter(
      (s) => s.studentAssignments.length === 0
    ));
  }

  confirmConflicts(): void {
    this.conflicts().forEach((student) => {
      const stopId = this.selectedAssignments.get(student.edufsUsername);
      if (stopId !== undefined) {
        this.approveStudentByStopId(student, stopId);
      }
    });
  }

  approveStudent(student: Student, index: number): void {
    const assignment = student.studentAssignments[index];
    student.studentAssignments.forEach((a) => {
      a.status =
        a.stopId === assignment.stopId ? Status.Accepted : Status.Declined;
    });
    this.updateStudent(student);
  }

  approveStudentByStopId(student: Student, stopId: number): void {
    student.studentAssignments.forEach((a) => {
      a.status = a.stopId === stopId ? Status.Accepted : Status.Declined;
    });
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
