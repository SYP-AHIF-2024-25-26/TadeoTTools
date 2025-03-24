import {patchState, signalStore, withComputed, withMethods, withState} from "@ngrx/signals";
import {Teacher, TeacherAssignment} from "../types";
import {inject} from "@angular/core";
import {TeacherService} from "../teacher.service";

type TeacherState = {
  teachers: Teacher[];
  loaded: boolean;
};

const initialState: TeacherState = {
  teachers: [],
  loaded: false
};

export const TeacherStore = signalStore(
  {providedIn: "root"},
  withState(initialState),
  withMethods((store) => {
    const teacherService = inject(TeacherService);

    (async function fetchInitialDivisions() {
      if (initialState.teachers.length == 0) {
        const teachers = await teacherService.getTeachers();
        patchState(store, {teachers, loaded: true});
      }
    })();

    return {
      async fetchInitialDivisions() {
        if (initialState.teachers.length == 0) {
          const teachers = await teacherService.getTeachers();
          patchState(store, {teachers, loaded: true});
        }
      },
      getTeachers(): Teacher[] {
        return store.teachers();
      },
      getTeachersByStopId(stopId: number): Teacher[] {
        console.log(store.teachers().map(t => t.edufsUsername));
        return store.teachers().filter((teacher) => {
          if (teacher.assignments) {
            return teacher.assignments.some((assignment) => assignment.stopId === stopId);
          }
          return false;
        });
      },
      getTeachersNotInStop(stopId: number): Teacher[] {
        const wrongTeachers = store.teachers().filter((teacher) => {
          if (teacher.assignments) {
            return teacher.assignments.some((assignment) => assignment.stopId === stopId);
          }
          return false;
        });
        return store.teachers().filter((teacher) => !wrongTeachers.includes(teacher));
      },
      async addStopToTeacher(edufsUsername: string, stopId: number): Promise<void> {
        const teacher = store.teachers().find((teacher) => teacher.edufsUsername === edufsUsername);
        if (teacher) {
          if (teacher.assignments === undefined) {
            teacher.assignments = [];
          }
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
