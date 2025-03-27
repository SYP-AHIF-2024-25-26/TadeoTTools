import {patchState, signalStore, withMethods, withState} from "@ngrx/signals";
import {Student} from "../types";
import {inject} from "@angular/core";
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
      async updateStudent(student: Student) {
        await studentService.updateStudent(student);
        patchState(store, {students: [...store.students().filter((s) => s.edufsUsername !== student.edufsUsername), student]});
      }
    };
  })
);
