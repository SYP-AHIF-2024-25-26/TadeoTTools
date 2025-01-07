import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { StopService } from '../stop.service';
import { Division, Stop, StopGroup } from '../types';
import { RouterModule } from '@angular/router';
import { StopGroupService } from '../stopgroup.service';
import { DivisionService } from '../division.service';
import { FilterComponent } from '../filter/filter.component';
import { DeletePopupComponent } from '../delete-popup/delete-popup.component';

@Component({
  selector: 'app-stops',
  standalone: true,
  imports: [RouterModule, FilterComponent, DeletePopupComponent],
  templateUrl: './stops.component.html',
  styleUrl: './stops.component.css',
})
export class StopsComponent implements OnInit {
  private service: StopService = inject(StopService);
  private groupService: StopGroupService = inject(StopGroupService);
  private divisionService: DivisionService = inject(DivisionService);

  stops = signal<Stop[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  divisions = signal<Division[]>([]);

  divisionFilter = signal<number>(0);
  showRemoveStopgroupPopup = signal<boolean>(false);

  stopGroupIdToRemove: number = -1;
  stopIdFromRemove: number = -1;

  filteredStops = computed(() =>
    this.filterStopsByDivisionId(this.divisionFilter())
  );

  async ngOnInit() {
    this.stops.set(await this.service.getStops());
    this.stopGroups.set(await this.groupService.getStopGroups());
    this.divisions.set(await this.divisionService.getDivisions());
  }

  async deleteStop(stopId: number) {
    await this.service.deleteStop(stopId);
    this.stops.set(await this.service.getStops());
  }

  filterStopsByDivisionId(divisionId: number): Stop[] {
    if (divisionId === 0) {
      return this.stops();
    }
    this.stops().forEach((stop) => console.log(stop));
    console.log('Filtering stops by divisionId: ' + divisionId);
    return this.stops().filter(
      (stop) =>
        Array.isArray(stop.divisionIds) && stop.divisionIds.includes(divisionId)
    );
  }

  getGroupById(sgId: number): StopGroup | null {
    return this.stopGroups().find((sg) => sg.id === sgId) || null;
  }

  async selectStopgroupToRemove(stopId: number, sgId: number) {
    this.stopGroupIdToRemove = sgId;
    this.stopIdFromRemove = stopId;
    this.showRemoveStopgroupPopup.set(true);
  }

  async removeStopgroup() {
    const stopToUpdate: Stop = this.stops().find((s) => s.id === this.stopIdFromRemove)!;
    stopToUpdate.stopGroupIds = stopToUpdate.stopGroupIds.filter((sgId) => sgId !== this.stopGroupIdToRemove);
    await this.service.updateStop(stopToUpdate);
    this.showRemoveStopgroupPopup.set(false);
    this.stops.set(await this.service.getStops());
    this.stopGroups.set(await this.groupService.getStopGroups());
  }
}
