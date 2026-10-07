import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
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
import { HasUnsavedChanges } from '@/core/guards/unsaved-changes.guard';
import { LoaderComponent } from '@/shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-stopgroups',
  standalone: true,
  imports: [
    InfoPopupComponent,
    DeletePopupComponent,
    StopGroupHeaderComponent,
    StopGroupListComponent,
    AddStopDialogComponent,
    LoaderComponent,
  ],
  templateUrl: './stop-group-list.component.html',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' },
})
export class StopGroupsComponent implements OnInit, HasUnsavedChanges {
  private stopGroupService = inject(StopGroupService);
  private divisionService = inject(DivisionService);
  private stopService = inject(StopService);
  private scrollService = inject(ScrollPersistenceService);
  private router = inject(Router);

  hasChanged = signal<boolean>(false);
  loading = signal<boolean>(true);
  loadFailed = signal<boolean>(false);
  saving = signal<boolean>(false);
  infos = signal<Info[]>([]);

  // Stop lists as last loaded/saved, so only groups whose stops changed are re-sent.
  private savedStopIds = new Map<number, string>();
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
    this.loading.set(true);
    this.loadFailed.set(false);
    try {
      const [groups, divisions, stops] = await Promise.all([
        this.stopGroupService.getStopGroups(),
        this.divisionService.getDivisions(),
        this.stopService.getStops(),
      ]);
      this.stopGroups.set(groups);
      this.divisions.set(divisions);
      this.stops.set(stops);
      this.rememberSavedStops();
      this.hasChanged.set(false);
    } catch (error) {
      console.error('Failed to load stop groups', error);
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.hasChanged();
  }

  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.hasChanged()) {
      event.preventDefault();
    }
  }

  private rememberSavedStops() {
    this.savedStopIds = new Map(
      this.stopGroups().map((group) => [
        group.id,
        JSON.stringify(group.stopIds),
      ])
    );
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
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    // The drop indices count only the visible cards; private groups may be
    // hidden, so translate them to positions in the full tour.
    const all = this.stopGroups();
    const visible = this.onlyPublicGroups()
      ? all.filter((group) => group.isPublic)
      : all;
    const from = all.indexOf(visible[event.previousIndex]);
    const to = all.indexOf(visible[event.currentIndex]);
    if (from < 0 || to < 0) {
      return;
    }
    const reordered = [...all];
    moveItemInArray(reordered, from, to);
    this.stopGroups.set(reordered);
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

  async saveChanges() {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      await this.stopGroupService.updateStopGroupOrder(
        this.stopGroups().map((group) => group.id)
      );
      const changedGroups = this.stopGroups().filter(
        (group) =>
          this.savedStopIds.get(group.id) !== JSON.stringify(group.stopIds)
      );
      await Promise.all(
        changedGroups.map((group) =>
          this.stopGroupService.updateStopGroup({
            id: group.id,
            name: group.name,
            description: group.description,
            isPublic: group.isPublic,
            stopIds: group.stopIds,
          })
        )
      );
      this.rememberSavedStops();
      this.hasChanged.set(false);
      this.addInfo('info', 'Tour order saved.');
    } catch (error) {
      console.error('Failed to save the tour', error);
      this.addInfo(
        'error',
        'The tour could not be saved. Your changes are still here, please try again.'
      );
    } finally {
      this.saving.set(false);
    }
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
