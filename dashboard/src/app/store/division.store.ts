import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Division, IsError } from '../types';
import { inject } from '@angular/core';
import { DivisionService } from '../division.service';

type DivisionState = {
  divisions: Division[];
};

const initialState: DivisionState = {
  divisions: [],
};

export const DivisionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const divisionService = inject(DivisionService);

    (async function fetchInitialDivisions() {
      if (initialState.divisions.length == 0) {
        const divisions = await divisionService.getDivisions();
        patchState(store, { divisions });
      }
    })();

    return {
      async addDivision(division: Division, image: File | null): Promise<IsError> {
        try {
          const createdDivision = await divisionService.addDivision(division);
          console.log('your id is: ' + createdDivision.id);
          patchState(store, {
            divisions: [...store.divisions(), createdDivision],
          });
          if (image) {
            await this.updateDivisionImg(createdDivision.id, image);
          }
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      async updateDivision(divisionToUpdate: Division): Promise<IsError> {
        try {
          patchState(store, {
            divisions: store.divisions().map((division) => (division.id === divisionToUpdate.id ? divisionToUpdate : division)),
          });
          await divisionService.updateDivision(divisionToUpdate);
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      async updateDivisionImg(divisionId: number, image: File): Promise<IsError> {
        try {
          await divisionService.updateDivisionImg(divisionId, image);
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      async deleteDivision(divisionIdToDel: number): Promise<IsError> {
        patchState(store, {
          divisions: store.divisions().filter((division) => division.id !== divisionIdToDel),
        });
        try {
          await divisionService.deleteDivision(divisionIdToDel);
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      async deleteDivisionImg(divisionId: number): Promise<IsError> {
        try {
          await divisionService.deleteDivisionImg(divisionId);
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      getDivisions() {
        return store.divisions();
      },
      getDivisionById(id: number) {
        return store.divisions().find((division) => division.id === id);
      },
    };
  })
);
