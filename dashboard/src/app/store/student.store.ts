import {patchState, signalStore, withComputed, withMethods, withState} from "@ngrx/signals";
import {Student, StudentAssignment} from "../types";
import {computed, inject} from "@angular/core";
import {StudentService} from "../student.service";

type StudentState = {
  students: Student[];
  loaded: boolean;
};

const initialState: StudentState = {
  students: [],
  loaded: false
};

export const StudentStore = signalStore(
  {providedIn: "root"},
  withState(initialState),
  withMethods((store) => {
    const studentService = inject(StudentService);

    (async function fetchInitialStudents() {
      if (initialState.students.length == 0) {
        const students = await studentService.getStudents();
        patchState(store, {students, loaded: true});
      }
    })();

    return {
      getStudentsByStopId(stopId: number) : Student[] {
        return store.students().filter((student) =>
          student.studentAssignments.some((assignment) => assignment.stopId == stopId)
        )
      },
      async updateStudent(student: Student) {
        await studentService.updateStudent(student);
        patchState(store, {students: [...store.students().filter((s) => s.edufsUsername !== student.edufsUsername), student]});
      },
      async addStopToStudent(assignment: StudentAssignment): Promise<Student[]> {
        const student = store.students().find((student) => student.edufsUsername === assignment.studentId);
        if (student) {
          student.studentAssignments.push(assignment);
          patchState(store, {students: [...store.students().filter((student) => student.edufsUsername !== assignment.studentId), student]});
        }
        return store.students();
      },
      removeStopFromStudent(edufsUsername: string, stopId: number): void {
        const student = store.students().find((student) => student.edufsUsername === edufsUsername);
        if (student) {
          student.studentAssignments = student.studentAssignments.filter((assignment) => assignment.stopId !== stopId);
          patchState(store, {students: [...store.students().filter((student) => student.edufsUsername !== edufsUsername), student]});
        }
      },
      async setAssignments(stopId: number) {
        await studentService.unassignAllFromStop(stopId);
        this.getStudentsByStopId(stopId).forEach((student) => {
          studentService.assignStopToStudent(student.edufsUsername, stopId);
        });
      };
    }
  )
  )
    ;
