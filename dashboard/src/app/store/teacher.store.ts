import {patchState, signalStore, withMethods, withState} from "@ngrx/signals";
import {Teacher, TeacherAssignment} from "../types";
import {inject} from "@angular/core";
import {TeacherService} from "../teacher.service";

type TeacherState = {
  teachers: Teacher[];
};

const initialState: TeacherState = {
  teachers: []
};

export const TeacherStore = signalStore(
  {providedIn: "root"},
  withState(initialState),
  withMethods((store) => {
    const teacherService = inject(TeacherService);

    (async function fetchInitialDivisions() {
      if (initialState.teachers.length == 0) {
        const teachers = await teacherService.getTeachers();
        patchState(store, {teachers});
      }
    })();

    return {
      getTeachers(): Teacher[] {
        return store.teachers();
      },
      getTeachersByStopId(stopId: number): Teacher[] {
        return store.teachers().filter((teacher) => {
          return teacher.assignments.some((assignment) => assignment.stopId === stopId);
        });
      },
      getTeachersNotInStop(stopId: number): Teacher[] {
        const wrongTeachers = store.teachers().filter((teacher) => {
          return teacher.assignments.some((assignment) => assignment.stopId === stopId);
        });
        return store.teachers().filter((teacher) => !wrongTeachers.includes(teacher));
      },
      addStopToTeacher(edufsUsername: string, stopId: number): void {
        const teacher = store.teachers().find((teacher) => teacher.edufsUsername === edufsUsername);
        if (teacher) {
          teacher.assignments.push({stopId} as TeacherAssignment);
          patchState(store, {teachers: store.teachers()});
        } 
      },
      removeStopFromTeacher(edufsUsername: string, stopId: number): void {
        const teacher = store.teachers().find((teacher) => teacher.edufsUsername === edufsUsername);
        if (teacher) {
          teacher.assignments = teacher.assignments.filter((assignment) => assignment.stopId !== stopId);
          patchState(store, {teachers: store.teachers()});
        }
        console.log(store.teachers());
      }
    };
  })
);
