import {Stop, StopGroup} from "../types";
import {patchState, signalStore, withMethods, withState} from "@ngrx/signals";
import {inject} from "@angular/core";
import {StopGroupService} from "../stopgroup.service";

export type StopGroupState = {
  stopGroups: StopGroup[];
  initialised: boolean;
}

const initialState: StopGroupState = {
  stopGroups: [],
  initialised: false
}

export const StopGroupStore = signalStore(
  {providedIn: "root"},
  withState(initialState),
  withMethods((store) => {
    const stopGroupService = inject(StopGroupService);
    (async function fetchInitialStopGroups() {
      if (initialState.stopGroups.length == 0) {
        const stopGroups = await stopGroupService.getStopGroups();
        patchState(store, {stopGroups: stopGroups, initialised: true});
      }
    })();
    return {
      async addStopGroup(stopGroupToAdd: StopGroup) {
        const stopGroup = await stopGroupService.addStopGroup(stopGroupToAdd);
        patchState(store, {
          stopGroups: [...store.stopGroups(), stopGroup]
        });
      },
      async updateStopGroup(stopGroupToUpdate: StopGroup) {
        await stopGroupService.updateStopGroup(stopGroupToUpdate);
        patchState(store, {
          stopGroups:
            store.stopGroups().map((stopGroup) =>
              stopGroup.id === stopGroupToUpdate.id ? stopGroupToUpdate : stopGroup
            )
        });
      },
      updateStopGroupOrder(order: number[]) {
        stopGroupService.updateStopGroupOrder(order);
      },
      async deleteStopGroup(stopGroupIdToDelete: number) {
        patchState(store, {
          stopGroups:
            store.stopGroups().filter((stopGroup) => stopGroup.id !== stopGroupIdToDelete)
        });
        await stopGroupService.deleteStopGroup(stopGroupIdToDelete);
      },
      getStopGroups() {
        return store.stopGroups();
      },
      getStopGroupById(id: number): StopGroup | undefined {
        return store.stopGroups().find((stopGroup) => stopGroup.id === id);
      }
    }
  })
)
