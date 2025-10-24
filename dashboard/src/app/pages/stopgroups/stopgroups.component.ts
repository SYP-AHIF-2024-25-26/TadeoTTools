import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
import { Division, Info, Stop, StopGroup, StopsShownInStopGroup } from '../../types';
import { InfoPopupComponent } from '../../popups/info-popup/info-popup.component';
import { FilterComponent } from '../../standard-components/filter/filter.component';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';
import { StopgroupDetailsComponent } from '../../detail-pages/stopgroup-details/stopgroup-details.component';
import { StopGroupService } from '../../stopgroup.service';
import { DivisionService } from '../../division.service';
import { StopService } from '../../stop.service';

@Component({
  selector: 'app-stopgroups',
  standalone: true,
  imports: [CdkDropList, CdkDrag, RouterLink, InfoPopupComponent, FilterComponent, DeletePopupComponent, StopgroupDetailsComponent],
  templateUrl: './stopgroups.component.html',
})
export class StopGroupsComponent implements OnInit {
  private stopGroupService = inject(StopGroupService);
  private divisionService = inject(DivisionService);
  private stopService = inject(StopService);

  hasChanged = signal<boolean>(false);
  infos = signal<Info[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  divisions = signal<Division[]>([]);
  stops = signal<Stop[]>([]);

  stopIdToRemove: number = -1;
  stopGroupToRemoveFrom: StopGroup | undefined = undefined;

  showStopsForStopGroup = signal<StopsShownInStopGroup[]>([]);
  showAssignedStops = signal<boolean>(false);
  showRemoveStopPopup = signal<boolean>(false);
  showRemoveGroupPopup = signal<boolean>(false);
  onlyPublicGroups = signal<boolean>(true);

  showGroupDetailPopUp = signal<boolean>(false);
  showAddStopDropDownPopup = signal<boolean>(false);
  groupIdDetail: number = -1;

  divisionFilter = signal<number>(0);

  filteredStops = computed(() => {
    let stops = this.filterStopsByDivisionId(this.divisionFilter());
    if (this.showAssignedStops()) {
      return stops;
    } else {
      const assignedStopIds = new Set<number>();
      this.stopGroups().forEach((group) => {
        group.stopIds.forEach((id) => assignedStopIds.add(id));
      });
      stops = stops.filter((stop) => !assignedStopIds.has(stop.id));
    }
    return stops;
  });

  stopsNotInStopGroup = computed(() => {
    let stopsInStopGroup = this.stopGroups().find((group) => group.id == this.groupIdDetail)?.stopIds;
    return this.stops().filter((stop) => !stopsInStopGroup?.includes(stop.id));
  });

  async ngOnInit() {
    await this.initialiseData();
  }

  async initialiseData() {
    this.stopGroups.set(await this.stopGroupService.getStopGroups());
    this.divisions.set(await this.divisionService.getDivisions());
    this.stops.set(await this.stopService.getStops());

    this.showStopsForStopGroup.set(
      this.stopGroups().map(
        (sg): StopsShownInStopGroup => ({
          stopGroupId: sg.id,
          isShown: false,
        })
      )
    );
    this.hasChanged.set(false);
  }

  toggleShowStops() {
    setTimeout(() => {
      const checkboxes = document.querySelectorAll('.collapse-checkbox') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    });
  }

  addInfo(type: string, message: string): void {
    const maxId = this.infos().reduce((max, item) => (item.id > max ? item.id : max), 0);
    const info = {
      id: maxId + 1,
      type: type,
      message: message,
    } as Info;
    this.infos.update((oldInfos) => [...oldInfos, info]);
  }

  deleteInfo(index: number) {
    this.infos.update((infos) => infos.filter((info) => info.id !== index));
  }

  getDropGroups(): string[] {
    return this.stopGroups().map((group) => 'group-' + group.id);
  }

  getStopName(stopId: number): string {
    return this.stops().filter((stop) => stop.id === stopId)[0]?.name || '';
  }

  dropStop(event: CdkDragDrop<any, any>) {
    if (event.previousContainer.id === 'all-stops') {
      const stopId = this.filteredStops()[event.previousIndex].id;
      if (!event.container.data.includes(stopId)) {
        event.container.data.splice(event.currentIndex, 0, stopId);
      }
    } else if (event.container === event.previousContainer) {
      moveItemInArray(event.previousContainer.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.hasChanged.set(true);
  }

  addStopBtnClick(stopId: number) {
    let stopsInGroup = this.stopGroups().find((group) => group.id == this.groupIdDetail);
    console.log('stopsInGroup before: ', stopsInGroup);
    stopsInGroup?.stopIds.unshift(stopId);
    console.log('stopsInGroup after: ', stopsInGroup);
    this.hasChanged.set(true);
    this.hasChanged.set(true);
    this.showAddStopDropDownPopup.set(false);
  }

  dropGroup(event: CdkDragDrop<any, any>) {
    moveItemInArray(this.stopGroups(), event.previousIndex, event.currentIndex);
    this.hasChanged.set(true);
  }

  filterStopsByDivisionId(divisionId: number): Stop[] {
    if (divisionId === 0) {
      return this.stops();
    }
    return this.stops().filter((stop) => Array.isArray(stop.divisionIds) && stop.divisionIds.includes(divisionId));
  }

  saveChanges() {
    this.stopGroupService.updateStopGroupOrder(this.stopGroups().map((group) => group.id));
    this.stopGroups().forEach(async (group) => {
      await this.stopGroupService.updateStopGroup(group);
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
      this.stopGroupToRemoveFrom.stopIds = this.stopGroupToRemoveFrom.stopIds.filter((sId) => sId !== this.stopIdToRemove);
      this.showRemoveStopPopup.set(false);
      this.hasChanged.set(true);
    }
  }
  showGroupPopUp(id: number): void {
    this.groupIdDetail = id;
    this.showGroupDetailPopUp.set(true);
  }

  deleteGroup() {}

  async handleGroupPopupClose(): Promise<void> {
    this.showGroupDetailPopUp.set(false);
    this.stopGroups.set(await this.stopGroupService.getStopGroups());
  }

  openAddStopPopup(group: StopGroup) {
    this.groupIdDetail = group.id;
    this.showAddStopDropDownPopup.set(true);
  }
}
