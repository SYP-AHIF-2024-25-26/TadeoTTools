import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Division } from '../types';
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
      async addDivision(division: Division, image: File | null): Promise<void> {
        try {
          const createdDivision = await divisionService.addDivision(division);
          console.log('your id is: ' + createdDivision.id);
          patchState(store, {
            divisions: [...store.divisions(), createdDivision],
          });
          if (image) {
            await this.updateDivisionImg(createdDivision.id, image);
          }
        } catch (error) {
          // Error is already handled by the service
        }
      },
      async updateDivision(divisionToUpdate: Division): Promise<void> {
        try {
          patchState(store, {
            divisions: store.divisions().map((division) => (division.id === divisionToUpdate.id ? divisionToUpdate : division)),
          });
          await divisionService.updateDivision(divisionToUpdate);
        } catch (error) {
          // Error is already handled by the service
        }
      },
      async updateDivisionImg(divisionId: number, image: File): Promise<void> {
        try {
          await divisionService.updateDivisionImg(divisionId, image);
        } catch (error) {
          // Error is already handled by the service
        }
      },
      async deleteDivision(divisionIdToDel: number): Promise<void> {
        patchState(store, {
          divisions: store.divisions().filter((division) => division.id !== divisionIdToDel),
        });
        try {
          await divisionService.deleteDivision(divisionIdToDel);
        } catch (error) {
          // Error is already handled by the service
        }
      },
      async deleteDivisionImg(divisionId: number): Promise<void> {
        try {
          await divisionService.deleteDivisionImg(divisionId);
        } catch (error) {
          // Error is already handled by the service
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
