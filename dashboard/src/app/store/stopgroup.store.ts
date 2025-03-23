import {StopGroup} from "../types";
import {patchState, signalStore, withMethods, withState} from "@ngrx/signals";
import {inject} from "@angular/core";
import {StopGroupService} from "../stopgroup.service";

export type StopGroupState = {
  stopGroups: StopGroup[];
}

const initialState: StopGroupState = {
  stopGroups: []
}

export const StopGroupStore = signalStore(
  {providedIn: "root"},
  withState(initialState),
  withMethods((store) => {
    const stopGroupService = inject(StopGroupService);
    (async function fetchInitialStopGroups() {
      if (initialState.stopGroups.length == 0) {
        const stopGroups = await stopGroupService.getStopGroups();
        patchState(store, {stopGroups});
      }
    })();
    return {
      async updateStopGroup(stopGroupToUpdate: StopGroup) {
        patchState(store, {
          stopGroups:
            store.stopGroups().map((stopGroup) =>
              stopGroup.id === stopGroupToUpdate.id ? stopGroupToUpdate : stopGroup
            )
        });
      },
      async deleteStopGroup(stopGroupIdToDelete: number) {
        patchState(store, {
          stopGroups:
            store.stopGroups().filter((stopGroup) => stopGroup.id !== stopGroupIdToDelete)
        });
      },
      getStopGroupById(id: number): StopGroup | undefined {
        return store.stopGroups().find((stopGroup) => stopGroup.id === id);
      }
    }
  })
)
