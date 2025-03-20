import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import {Stop, StopWithoutOrders} from "../types";
import { inject } from "@angular/core";
import { StopService } from "../stop.service";



type StopState = {
  stops: Stop[];
};

const initialState: StopState = {
  stops: []
};

export const StopStore = signalStore(
  { providedIn: "root" },
  withState(initialState),
  withMethods((store) => {
    const stopService = inject(StopService);

    (async function fetchInitialStops() {
      if (initialState.stops.length == 0) {
        const stops = await stopService.getStops();
        patchState(store, {stops});
      }
    })();

    return {
      async updateStop(stopToUpdate: Stop) {
        patchState(store, {
          stops: store.stops().map((stop) =>
            stop.id === stopToUpdate.id ? stopToUpdate : stop
          )
        });
        await stopService.updateStop(stopToUpdate as StopWithoutOrders);
      }
    };
  })
);
