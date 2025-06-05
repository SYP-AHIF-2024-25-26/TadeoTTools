import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {RouterLink} from '@angular/router';
import {Info, Stop, StopGroup, StopsShownInStopGroup} from '../../types';
import {InfoPopupComponent} from '../../popups/info-popup/info-popup.component';
import {FilterComponent} from '../../standard-components/filter/filter.component';
import {DeletePopupComponent} from '../../popups/delete-popup/delete-popup.component';
import {StopStore} from '../../store/stop.store';
import {DivisionStore} from '../../store/division.store';
import {StopGroupStore} from '../../store/stopgroup.store';
import {StopgroupDetailsComponent} from '../../detail-pages/stopgroup-details/stopgroup-details.component';

@Component({
  selector: 'app-stopgroups',
  standalone: true,
  imports: [CdkDropList, CdkDrag, RouterLink, InfoPopupComponent, FilterComponent, DeletePopupComponent, StopgroupDetailsComponent],
  templateUrl: './stopgroups.component.html',
})
export class StopGroupsComponent implements OnInit {
  stopStore = inject(StopStore);
  stopGroupStore = inject(StopGroupStore);
  divisionStore = inject(DivisionStore);
  hasChanged = signal<boolean>(false);

  infos = signal<Info[]>([]);

  stopIdToRemove: number = -1;
  stopGroupToRemoveFrom: StopGroup | undefined = undefined;

  showStopsForStopGroup = signal<StopsShownInStopGroup[]>([]);
  showRemoveStopPopup = signal<boolean>(false);
  showRemoveGroupPopup = signal<boolean>(false);
  onlyPublicGroups = signal<boolean>(false);

  showGroupDetailPopUp = signal<boolean>(false);
  groupIdDetail: number = -1;

  divisionFilter = signal<number>(0);


  filteredStops = computed(() => this.filterStopsByDivisionId(this.divisionFilter()));

  async ngOnInit() {
    await this.initialiseData();
  }

  async initialiseData() {
    while (!this.stopGroupStore.initialised()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.showStopsForStopGroup.set(
      this.stopGroupStore.stopGroups().map(
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
      checkboxes.forEach(checkbox => {
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
    return this.stopGroupStore.stopGroups().map((group) => 'group-' + group.id);
  }

  dropStop(event: CdkDragDrop<any, any>) {
    if (event.previousContainer.id === 'all-stops') {
      const stopId = this.stopStore.stops()[event.previousIndex].id;
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

  dropGroup(event: CdkDragDrop<any, any>) {
    moveItemInArray(this.stopGroupStore.stopGroups(), event.previousIndex, event.currentIndex);
    this.hasChanged.set(true);
  }

  filterStopsByDivisionId(divisionId: number): Stop[] {
    if (divisionId === 0) {
      return this.stopStore.stops();
    }
    return this.stopStore.stops().filter((stop) => Array.isArray(stop.divisionIds) && stop.divisionIds.includes(divisionId));
  }

  saveChanges() {
    this.stopGroupStore.updateStopGroupOrder(this.stopGroupStore.stopGroups().map((group) => group.id));
    this.stopGroupStore.stopGroups().forEach(async (group) => {
      await this.stopGroupStore.updateStopGroup(group);
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
}
