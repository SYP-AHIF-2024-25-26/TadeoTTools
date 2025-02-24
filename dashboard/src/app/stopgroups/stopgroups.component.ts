import { Component, computed, inject, signal } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
import { StopGroupService } from '../stopgroup.service';
import { StopService } from '../stop.service';
import { DivisionService } from '../division.service';
import {Division, Info, Stop, StopGroup, StopsShownInStopGroup} from '../types';
import { InfoPopupComponent } from '../info-popup/info-popup.component';
import { FilterComponent } from '../filter/filter.component';
import { DeletePopupComponent } from '../delete-popup/delete-popup.component';
import {NavbarComponent} from "../navbar/navbar.component";

@Component({
  selector: 'app-stopgroups',
  standalone: true,
  imports: [
    CdkDropList,
    CdkDrag,
    RouterLink,
    InfoPopupComponent,
    FilterComponent,
    DeletePopupComponent,
    NavbarComponent,
  ],
  templateUrl: './stopgroups.component.html',
  styleUrl: './stopgroups.component.css',
})
export class StopGroupsComponent {
  stopGroupFetcher = inject(StopGroupService);
  stopFetcher = inject(StopService);
  divisionFetcher = inject(DivisionService);
  hasChanged = signal<boolean>(false);

  stopGroups = signal<StopGroup[]>([]);
  stops = signal<Stop[]>([]);
  divisions = signal<Division[]>([]);
  infos = signal<Info[]>([]);

  stopIdToRemove: number = -1;
  stopGroupToRemoveFrom: StopGroup | undefined = undefined;

  showStopsForStopGroup = signal<StopsShownInStopGroup[]>([]);
  showRemoveStopPopup = signal<boolean>(false);
  showRemoveGroupPopup = signal<boolean>(false);
  onlyPublicGroups = signal<boolean>(false);

  divisionFilter = signal<number>(0);

  filteredStops = computed(() =>
    this.filterStopsByDivisionId(this.divisionFilter())
  );

  async ngOnInit() {
    this.addInfo('info', 'Retrieving Data');
    await this.initialiseData();
  }

  async initialiseData() {
    await this.getDivisions();
    await this.getStopGroups();
    await this.getStops();
    this.showStopsForStopGroup.set(this.stopGroups().map((sg): StopsShownInStopGroup => ({
      stopGroupId: sg.id,
      isShown: false
    })));
    this.hasChanged.set(false);
  }

  async getStopGroups() {
    this.stopGroups.set(await this.stopGroupFetcher.getStopGroups());
  }

  async getStops() {
    this.stops.set(await this.stopFetcher.getStops());
  }

  async getDivisions() {
    const divisions = await this.divisionFetcher.getDivisions();
    this.divisions.set(divisions);
  }

  shouldStopsBeShown(stopGroupId: number): boolean{
    let showStops = this.showStopsForStopGroup().find(s => s.stopGroupId === stopGroupId);
    return showStops !== undefined && showStops.isShown;
  }

  toggleShowStops() {
    this.showStopsForStopGroup.update(show => show.map((sg): StopsShownInStopGroup => ({
      stopGroupId: sg.stopGroupId,
      isShown: false
    })));
  }

  toggleShowStop(stopGroupId: number) {
    let showStops = this.showStopsForStopGroup().find(s => s.stopGroupId === stopGroupId);
    showStops!.isShown = !showStops?.isShown;
  }

  addInfo(type: string, message: string): void {
    const maxId = this.infos().reduce(
      (max, item) => (item.id > max ? item.id : max),
      0
    );
    const info = {
      id: maxId + 1,
      type: type,
      message: message,
    } as Info;
    this.infos.update((oldInfos) => [...oldInfos, info]);
  }

  deleteInfo(index: number) {
    console.log('Deleting info with index: ' + index);
    this.infos.update((infos) => infos.filter((info) => info.id !== index));
  }

  getDropGroups(): string[] {
    return this.stopGroups().map((group) => 'group-' + group.id);
  }

  getStopByStopId(stopId: number): Stop | undefined {
    return this.stops().find((stop) => stop.id === stopId);
  }

  dropStop(event: CdkDragDrop<any, any>) {
    if (event.previousContainer.id === 'all-stops') {
      const stopId = this.stops()[event.previousIndex].id;
      if (!event.container.data.includes(stopId)) {
        event.container.data.splice(event.currentIndex, 0, stopId);
      } else {
        console.log('already exists in this stopGroup');
      }
    } else if (event.container === event.previousContainer) {
      moveItemInArray(
        event.previousContainer.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.hasChanged.set(true);
  }

  dropGroup(event: CdkDragDrop<any, any>) {
    moveItemInArray(this.stopGroups(), event.previousIndex, event.currentIndex);
    this.hasChanged.set(true);
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

  saveChanges() {
    this.stopGroupFetcher.updateStopGroupOrder(
      this.stopGroups().map((group) => group.id)
    );
    this.stopGroups().forEach(async (group) => {
      await this.stopGroupFetcher.updateStopGroup(group);
    });
    this.hasChanged.set(false);
  }

  selectStopToRemove(stopId: number, group: StopGroup) {
    this.stopIdToRemove = stopId;
    this.stopGroupToRemoveFrom = group;
    this.showRemoveStopPopup.set(true);
  }

  removeStop() {
    if (this.stopGroupToRemoveFrom !== undefined) {
      this.stopGroupToRemoveFrom.stopIds =
        this.stopGroupToRemoveFrom.stopIds.filter(
          (sId) => sId !== this.stopIdToRemove
        );
      this.showRemoveStopPopup.set(false);
      this.hasChanged.set(true);
    }
  }

  deleteGroup() {}
}
