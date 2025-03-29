import {patchState, signalStore, withMethods, withState} from "@ngrx/signals";
import {Stop, StopWithoutOrders} from "../types";
import {inject} from "@angular/core";
import {StopService} from "../stop.service";


type StopState = {
  stops: Stop[];
  loaded: boolean;
};

const initialState: StopState = {
  stops: [],
  loaded: false,
};

export const StopStore = signalStore(
  {providedIn: "root"},
  withState(initialState),
  withMethods((store) => {
    const stopService = inject(StopService);

    (async function fetchInitialStops() {
      if (initialState.stops.length == 0) {
        const stops = await stopService.getStops();
        console.log("Fetched stops: ", stops);
        patchState(store, {stops: stops, loaded: true});
      }
    })();

    return {
      async addStop(stopToAdd: Stop) {
        const stop = await stopService.addStop(stopToAdd);
        console.log(stop);
        patchState(store, {
          stops: [...store.stops(), stop]
        });
      },
      async updateStop(stopToUpdate: Stop) {
        patchState(store, {
          stops: store.stops().map((stop) =>
            stop.id === stopToUpdate.id ? stopToUpdate : stop
          )
        });
        await stopService.updateStop(stopToUpdate as StopWithoutOrders);
      },
      async deleteStop(stopIdToDelete: number) {
        patchState(store, {
          stops: store.stops().filter((stop) => stop.id !== stopIdToDelete)
        });
        await stopService.deleteStop(stopIdToDelete);
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
        return store.stops().filter(
          (stop) =>
            Array.isArray(stop.divisionIds) && stop.divisionIds.includes(divisionId)
        );
      }
    };
  })
);
