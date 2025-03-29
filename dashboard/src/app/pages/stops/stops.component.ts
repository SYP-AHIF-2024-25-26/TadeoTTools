import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Division, Stop, StopGroup } from '../../types';
import { RouterModule } from '@angular/router';
import { FilterComponent } from '../../standard-components/filter/filter.component';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';
import {StopStore} from "../../store/stop.store";
import {StopGroupStore} from "../../store/stopgroup.store";
import {DivisionStore} from "../../store/division.store";

@Component({
    selector: 'app-stops',
    standalone: true,
    imports: [RouterModule, FilterComponent, DeletePopupComponent],
    templateUrl: './stops.component.html',
})
export class StopsComponent {
  private stopStore = inject(StopStore);
  private stopGroupStore = inject(StopGroupStore);
  protected divisionStore = inject(DivisionStore);

  divisionFilter = signal<number>(0);
  showRemoveStopgroupPopup = signal<boolean>(false);

  stopGroupIdToRemove: number = -1;
  stopIdFromRemove: number = -1;

  filteredStops = computed(() =>
    this.stopStore.filterStopsByDivisionId(this.divisionFilter())
  );


  async deleteStop(stopId: number) {
    await this.stopStore.deleteStop(stopId);
  }

  getGroupById(sgId: number): StopGroup | null {
    return this.stopGroupStore.stopGroups().find((sg) => sg.id === sgId) || null;
  }

  async selectStopgroupToRemove(stopId: number, sgId: number) {
    this.stopGroupIdToRemove = sgId;
    this.stopIdFromRemove = stopId;
    this.showRemoveStopgroupPopup.set(true);
  }

  async removeStopgroup() {
    const stopToUpdate: Stop = this.stopStore.stops().find((s) => s.id === this.stopIdFromRemove)!;
    stopToUpdate.stopGroupIds = stopToUpdate.stopGroupIds.filter((sgId) => sgId !== this.stopGroupIdToRemove);
    await this.stopStore.updateStop(stopToUpdate);
    this.showRemoveStopgroupPopup.set(false);
  }
}
