import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Student, StudentAssignment } from '../types';
import { inject } from '@angular/core';
import { StudentService } from '../student.service';

type StudentState = {
  students: Student[];
  loaded: boolean;
};

const initialState: StudentState = {
  students: [],
  loaded: false,
};

export const StudentStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const studentService = inject(StudentService);

    (async function fetchInitialStudents() {
      if (initialState.students.length == 0) {
        const students = await studentService.getStudents();
        patchState(store, { students, loaded: true });
      }
    })();

    return {
      getTeacherByUsername(edufsUsername: string): Student | undefined {
        return store.students().find((student) => student.edufsUsername === edufsUsername);
      },
      getStudentsByStopId(stopId: number): Student[] {
        return store.students().filter((student) => student.studentAssignments.some((assignment) => assignment.stopId == stopId));
      },
      async updateStudent(student: Student) {
        await studentService.updateStudent(student);
        patchState(store, { students: [...store.students().filter((s) => s.edufsUsername !== student.edufsUsername), student] });
      },
      async addStopToStudent(assignment: StudentAssignment): Promise<Student[]> {
        const student = store.students().find((student) => student.edufsUsername === assignment.studentId);
        if (student) {
          student.studentAssignments.push(assignment);
          patchState(store, { students: [...store.students().filter((student) => student.edufsUsername !== assignment.studentId), student] });
        }
        return store.students();
      },
      removeStopFromStudent(edufsUsername: string, stopId: number): void {
        const student = store.students().find((student) => student.edufsUsername === edufsUsername);
        if (student) {
          student.studentAssignments = student.studentAssignments.filter((assignment) => assignment.stopId !== stopId);
          patchState(store, { students: [...store.students().filter((student) => student.edufsUsername !== edufsUsername), student] });
        }
      },
      // Since the stopId we set earlier was -1 because we didn't know yet we have to change it to the real stopId here
      setStopIdForAssignmentsOnNewStop(stopId: number) {
        store.students().forEach((student) => {
          student.studentAssignments.forEach((assignment) => {
            if (assignment.stopId === -1) {
              assignment.stopId = stopId;
            }
          });
        });
        patchState(store, { students: [...store.students()] });
      },
      async setAssignments(edufsUsername: string) {
        const teacher = this.getTeacherByUsername(edufsUsername);
        if (teacher) {
          console.log(teacher.firstName + ' ' + teacher.lastName + ' ' + teacher.edufsUsername);
          await studentService.setAssignments(edufsUsername, teacher.studentAssignments);
        }
      },
    };
  })
);
