import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Division, Stop, StopGroup } from '@/shared/models/types';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { StopGroupService } from '@/core/services/stopgroup.service';
import { DivisionService } from '@/core/services/division.service';
import { StopService } from '@/core/services/stop.service';
import { StopGroupHeaderComponent } from './components/stop-group-header/stop-group-header.component';
import { StopGroupListComponent } from './components/stop-group-list/stop-group-list.component';
import { AddStopDialogComponent } from './components/add-stop-dialog/add-stop-dialog.component';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '@/core/services/toast.service';
import { HasUnsavedChanges } from '@/core/guards/unsaved-changes.guard';
import { LoaderComponent } from '@/shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';

@Component({
  selector: 'app-stopgroups',
  imports: [
    DeletePopupComponent,
    StopGroupHeaderComponent,
    StopGroupListComponent,
    AddStopDialogComponent,
    LoaderComponent,
    PageHeaderComponent,
    RouterLink,
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
  private toast = inject(ToastService);

  hasChanged = signal<boolean>(false);
  loading = signal<boolean>(true);
  loadFailed = signal<boolean>(false);
  saving = signal<boolean>(false);

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
    this.moveVisibleGroup(event.previousIndex, event.currentIndex);
  }

  moveVisibleGroup(from: number, to: number) {
    if (from === to) {
      return;
    }
    // Indices count only the visible cards. Reorder the visible
    // groups among the slots they already occupy, so hidden private groups
    // keep their exact positions in the tour.
    const all = this.stopGroups();
    const isVisible = (group: StopGroup) =>
      !this.onlyPublicGroups() || group.isPublic;
    const visible = all.filter(isVisible);
    moveItemInArray(visible, from, to);
    let next = 0;
    this.stopGroups.set(
      all.map((group) => (isVisible(group) ? visible[next++] : group))
    );
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
      this.toast.success('Tour order saved.');
    } catch (error) {
      console.error('Failed to save the tour', error);
      this.toast.error(
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
