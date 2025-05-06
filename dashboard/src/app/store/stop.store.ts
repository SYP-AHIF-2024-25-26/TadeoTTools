import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Stop, StopWithoutOrders } from '../types';
import { inject } from '@angular/core';
import { StopService } from '../stop.service';

type StopState = {
  stops: Stop[];
  loaded: boolean;
};

const initialState: StopState = {
  stops: [],
  loaded: false,
};

export const StopStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const stopService = inject(StopService);

    (async function fetchInitialStops() {
      if (initialState.stops.length == 0) {
        const stops = await stopService.getStops();
        console.log('Fetched stops: ', stops);
        patchState(store, { stops: stops, loaded: true });
      }
    })();

    return {
      async addStop(stopToAdd: Stop): Promise<void> {
        try {
          const stop = await stopService.addStop(stopToAdd);
          console.log(stop);
          patchState(store, {
            stops: [...store.stops(), stop],
          });
        } catch (error) {
          // Error is already handled by the service
        }
      },
      async updateStop(stopToUpdate: Stop): Promise<void> {
        try {
          patchState(store, {
            stops: store.stops().map((stop) => (stop.id === stopToUpdate.id ? stopToUpdate : stop)),
          });
          await stopService.updateStop(stopToUpdate as StopWithoutOrders);
        } catch (error) {
          // Error is already handled by the service
        }
      },
      async deleteStop(stopIdToDelete: number): Promise<void> {
        patchState(store, {
          stops: store.stops().filter((stop) => stop.id !== stopIdToDelete),
        });
        try {
          await stopService.deleteStop(stopIdToDelete);
        } catch (error) {
          // Error is already handled by the service
        }
      },
      getStops() {
        return store.stops();
      },
      getStopById(id: number): Stop | undefined {
        return store.stops().find((stop) => stop.id == id);
      },
      filterStopsByDivisionId(divisionId: number): Stop[] {
        if (divisionId === 0) {
          return store.stops();
        }
        return store.stops().filter((stop) => Array.isArray(stop.divisionIds) && stop.divisionIds.includes(divisionId));
      },
    };
  })
);
