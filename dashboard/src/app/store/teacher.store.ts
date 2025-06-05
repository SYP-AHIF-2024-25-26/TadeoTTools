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
        return store.teachers().filter((teacher) => {
          if (teacher.assignedStops) {
            return teacher.assignedStops.some((assignment) => assignment === stopId);
          }
          return false;
        });
      },
      getTeachersNotInStop(stopId: number): Teacher[] {
        const wrongTeachers = store.teachers().filter((teacher) => {
          if (teacher.assignedStops) {
            return teacher.assignedStops.some((assignment) => assignment === stopId);
          }
          return false;
        });
        return store.teachers().filter((teacher) => !wrongTeachers.includes(teacher));
      },
      async addStopToTeacher(edufsUsername: string, stopId: number): Promise<Teacher[]> {
        const teacher = store.teachers().find((teacher) => teacher.edufsUsername === edufsUsername);
        if (teacher) {
          if (teacher.assignedStops === undefined) {
            teacher.assignedStops = [];
          }
          teacher.assignedStops.push(stopId);
          patchState(store, { teachers: [...store.teachers().filter((teacher) => teacher.edufsUsername !== edufsUsername), teacher] });
        }
        return store.teachers();
      },
      removeStopFromTeacher(edufsUsername: string, stopId: number): void {
        const teacher = store.teachers().find((teacher) => teacher.edufsUsername === edufsUsername);
        if (teacher) {
          teacher.assignedStops = teacher.assignedStops.filter((assignment) => assignment !== stopId);
          patchState(store, { teachers: [...store.teachers().filter((teacher) => teacher.edufsUsername !== edufsUsername), teacher] });
        }
      },
      async setAssignments(edufsUsername: string) {
        const teacher = this.getTeacherById(edufsUsername);
        if (teacher) {
          await teacherService.setAssignments(edufsUsername, teacher.assignedStops);
        }
      },
      setStopIdForAssignmentsOnNewStop(stopId: number) {
        store.teachers().forEach((teacher) => {
          if (teacher.assignedStops.includes(-1)) {
            teacher.assignedStops = teacher.assignedStops.map((assignment) => (assignment === -1 ? stopId : assignment));
          }
        });
        patchState(store, { teachers: [...store.teachers()] });
      },
    };
  })
);
