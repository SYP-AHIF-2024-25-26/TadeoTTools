import { IsError, Stop, StopGroup } from '../types';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { StopGroupService } from '../stopgroup.service';

export type StopGroupState = {
  stopGroups: StopGroup[];
  initialised: boolean;
};

const initialState: StopGroupState = {
  stopGroups: [],
  initialised: false,
};

export const StopGroupStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const stopGroupService = inject(StopGroupService);
    (async function fetchInitialStopGroups() {
      if (initialState.stopGroups.length == 0) {
        const stopGroups = await stopGroupService.getStopGroups();
        patchState(store, { stopGroups: stopGroups, initialised: true });
      }
    })();
    return {
      async addStopGroup(stopGroupToAdd: StopGroup): Promise<IsError> {
        try {
          const stopGroup = await stopGroupService.addStopGroup(stopGroupToAdd);
          patchState(store, {
            stopGroups: [...store.stopGroups(), stopGroup],
          });
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      async updateStopGroup(stopGroupToUpdate: StopGroup): Promise<IsError> {
        try {
          await stopGroupService.updateStopGroup(stopGroupToUpdate);
          patchState(store, {
            stopGroups: store.stopGroups().map((stopGroup) => (stopGroup.id === stopGroupToUpdate.id ? stopGroupToUpdate : stopGroup)),
          });
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      async updateStopGroupOrder(order: number[]): Promise<IsError> {
        try {
          await stopGroupService.updateStopGroupOrder(order);
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      async deleteStopGroup(stopGroupIdToDelete: number): Promise<IsError> {
        patchState(store, {
          stopGroups: store.stopGroups().filter((stopGroup) => stopGroup.id !== stopGroupIdToDelete),
        });
        try {
          await stopGroupService.deleteStopGroup(stopGroupIdToDelete);
          return {isError: false};
        } catch (error) {
          return {isError: true};
        }
      },
      getStopGroups() {
        return store.stopGroups();
      },
      getStopGroupById(id: number): StopGroup | undefined {
        return store.stopGroups().find((stopGroup) => stopGroup.id === id);
      },
    };
  })
);
