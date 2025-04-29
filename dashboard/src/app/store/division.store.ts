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
      async addDivision(division: Division, image: File | null) {
        const createdDivision = await divisionService.addDivision(division);
        console.log('your id is: ' + createdDivision.id);
        patchState(store, {
          divisions: [...store.divisions(), createdDivision],
        });
        if (image) {
          await this.updateDivisionImg(createdDivision.id, image);
        }
      },
      async updateDivision(divisionToUpdate: Division) {
        patchState(store, {
          divisions: store.divisions().map((division) => (division.id === divisionToUpdate.id ? divisionToUpdate : division)),
        });
        await divisionService.updateDivision(divisionToUpdate);
      },
      async updateDivisionImg(divisionId: number, image: File) {
        await divisionService.updateDivisionImg(divisionId, image);
      },
      async deleteDivision(divisionIdToDel: number) {
        patchState(store, {
          divisions: store.divisions().filter((division) => division.id !== divisionIdToDel),
        });
        await divisionService.deleteDivision(divisionIdToDel);
      },
      async deleteDivisionImg(divisionId: number) {
        await divisionService.deleteDivisionImg(divisionId);
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
