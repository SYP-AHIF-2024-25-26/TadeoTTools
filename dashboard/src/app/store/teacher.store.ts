import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Teacher } from '../types';
import { inject } from '@angular/core';
import { TeacherService } from '../teacher.service';

type TeacherState = {
  teachers: Teacher[];
  loaded: boolean;
};

const initialState: TeacherState = {
  teachers: [],
  loaded: false,
};

export const TeacherStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const teacherService = inject(TeacherService);

    (async function fetchInitialTeachers() {
      if (initialState.teachers.length == 0) {
        const teachers = await teacherService.getTeachers();
        patchState(store, { teachers, loaded: true });
      }
    })();

    return {
      getTeachers(): Teacher[] {
        return store.teachers();
      },
      getTeacherById(id: string): Teacher | undefined {
        return store.teachers().find((teacher) => teacher.edufsUsername === id);
      },
      getTeachersByStopId(stopId: number): Teacher[] {
        console.log(store.teachers().map((t) => t.edufsUsername));
        return store.teachers().filter((teacher) => {
          if (teacher.stopAssignments) {
            return teacher.stopAssignments.some((assignment) => assignment === stopId);
          }
          return false;
        });
      },
      getTeachersNotInStop(stopId: number): Teacher[] {
        const wrongTeachers = store.teachers().filter((teacher) => {
          if (teacher.stopAssignments) {
            return teacher.stopAssignments.some((assignment) => assignment === stopId);
          }
          return false;
        });
        return store.teachers().filter((teacher) => !wrongTeachers.includes(teacher));
      },
      async addStopToTeacher(edufsUsername: string, stopId: number): Promise<Teacher[]> {
        const teacher = store.teachers().find((teacher) => teacher.edufsUsername === edufsUsername);
        if (teacher) {
          if (teacher.stopAssignments === undefined) {
            teacher.stopAssignments = [];
          }
          teacher.stopAssignments.push(stopId);
          patchState(store, { teachers: [...store.teachers().filter((teacher) => teacher.edufsUsername !== edufsUsername), teacher] });
        }
        return store.teachers();
      },
      removeStopFromTeacher(edufsUsername: string, stopId: number): void {
        const teacher = store.teachers().find((teacher) => teacher.edufsUsername === edufsUsername);
        if (teacher) {
          teacher.stopAssignments = teacher.stopAssignments.filter((assignment) => assignment !== stopId);
          patchState(store, { teachers: [...store.teachers().filter((teacher) => teacher.edufsUsername !== edufsUsername), teacher] });
        }
        console.log(store.teachers());
      },
      async setAssignments(edufsUsername: string) {
        const teacher = this.getTeacherById(edufsUsername);
        if (teacher) {
          await teacherService.setAssignments(edufsUsername, teacher.stopAssignments);
        }
      },
      setStopIdForAssignmentsOnNewStop(stopId: number) {
        store.teachers().forEach((teacher) => {
          teacher.stopAssignments.forEach((assignment) => {
            if (assignment === -1) {
              assignment = stopId;
            }
          });
        });
        patchState(store, { teachers: [...store.teachers()] });
      },
    };
  })
);
