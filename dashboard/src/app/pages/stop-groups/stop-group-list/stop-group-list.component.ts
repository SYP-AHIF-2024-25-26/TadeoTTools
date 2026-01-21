import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem, } from '@angular/cdk/drag-drop';
import { Division, Info, Stop, StopGroup } from '@/shared/models/types';
import { InfoPopupComponent } from '@/shared/modals/info-modal/info-modal.component';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { StopGroupService } from '@/core/services/stopgroup.service';
import { DivisionService } from '@/core/services/division.service';
import { StopService } from '@/core/services/stop.service';
import { StopGroupHeaderComponent } from './components/stop-group-header/stop-group-header.component';
import { StopGroupListComponent } from './components/stop-group-list/stop-group-list.component';
import { StopSidebarComponent } from './components/stop-sidebar/stop-sidebar.component';
import { AddStopDialogComponent } from './components/add-stop-dialog/add-stop-dialog.component';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-stopgroups',
  standalone: true,
  imports: [
    InfoPopupComponent,
    DeletePopupComponent,
    StopGroupHeaderComponent,
    StopGroupListComponent,
    AddStopDialogComponent,
  ],
  templateUrl: './stop-group-list.component.html',
})
export class StopGroupsComponent implements OnInit {
  private stopGroupService = inject(StopGroupService);
  private divisionService = inject(DivisionService);
  private stopService = inject(StopService);
  private scrollService = inject(ScrollPersistenceService);
  private router = inject(Router);

  hasChanged = signal<boolean>(false);
  infos = signal<Info[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  divisions = signal<Division[]>([]);
  stops = signal<Stop[]>([]);

  stopIdToRemove: number = -1;
  stopGroupToRemoveFrom: StopGroup | undefined = undefined;

  showAssignedStops = signal<boolean>(false);
  showRemoveStopPopup = signal<boolean>(false);
  onlyPublicGroups = signal<boolean>(true);

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
    let stopsInStopGroup = this.stopGroups().find(
      (group) => group.id == this.groupIdDetail
    )?.stopIds;
    return this.stops().filter((stop) => !stopsInStopGroup?.includes(stop.id));
  });

  dropGroups = computed(() => {
    return this.stopGroups().map((group) => 'group-' + group.id);
  });

  async ngOnInit() {
    await this.initialiseData();
    this.scrollService.restoreScroll();
  }

  async initialiseData() {
    this.stopGroups.set(await this.stopGroupService.getStopGroups());
    this.divisions.set(await this.divisionService.getDivisions());
    this.stops.set(await this.stopService.getStops());
    this.hasChanged.set(false);
  }

  toggleShowStops() {
    setTimeout(() => {
      const checkboxes = document.querySelectorAll(
        '.collapse-checkbox'
      ) as NodeListOf<HTMLInputElement>;
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
      });
    });
  }

  navigateToNewGroup() {
    this.router.navigate(['/stopgroup']);
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
    this.infos.update((infos) => infos.filter((info) => info.id !== index));
  }

  dropStop(event: CdkDragDrop<any, any>) {
    if (event.previousContainer.id === 'all-stops') {
      const stopId = this.filteredStops()[event.previousIndex].id;
      if (!event.container.data.includes(stopId)) {
        event.container.data.splice(event.currentIndex, 0, stopId);
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

  addStopBtnClick(stopId: number) {
    let stopsInGroup = this.stopGroups().find(
      (group) => group.id == this.groupIdDetail
    );
    stopsInGroup?.stopIds.unshift(stopId);
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
    return this.stops().filter(
      (stop) =>
        Array.isArray(stop.divisionIds) && stop.divisionIds.includes(divisionId)
    );
  }

  saveChanges() {
    this.stopGroupService.updateStopGroupOrder(
      this.stopGroups().map((group) => group.id)
    );
    this.stopGroups().forEach(async (group) => {
      await this.stopGroupService.updateStopGroup({
        id: group.id,
        name: group.name,
        description: group.description,
        isPublic: group.isPublic,
        stopIds: group.stopIds,
      });
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
}
