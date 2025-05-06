import {patchState, signalStore, withComputed, withMethods, withState} from "@ngrx/signals";
import {Info} from "../types";
import {computed} from "@angular/core";


type InfoState = {
  infos: Info[];
};

const initialState: InfoState = {
  infos: [
  ]
};

export const InfoStore = signalStore(
  {providedIn: "root"},
  withState(initialState),
  withMethods((store) => {
    return {
      addInfo(info: Info) {
        info.id = store.infos().length > 0 ? Math.max(...store.infos().map(info => info.id)) + 1 : 0;
        patchState(store, {infos: [...store.infos(), info]});
      },
      removeInfoById(id: number) {
        patchState(store, {infos: store.infos().filter(info => info.id !== id)});
      }
    }
  })
);
