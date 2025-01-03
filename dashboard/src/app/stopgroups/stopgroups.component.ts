import {Component, computed, inject, signal, WritableSignal} from '@angular/core';
import {CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from "@angular/cdk/drag-drop";
import {RouterLink} from "@angular/router";
import {StopGroupService} from "../stopgroup.service";
import {StopService} from "../stop.service";
import {DivisionService} from "../division.service";
import {Division, Info, Stop, StopGroup} from "../types";
import {InfoPopupComponent} from "../info-popup/info-popup.component";
import {FilterComponent} from "../filter/filter.component";

@Component({
  selector: 'app-stopgroups',
  standalone: true,
  imports: [CdkDropList, CdkDrag, RouterLink, InfoPopupComponent, FilterComponent],
  templateUrl: './stopgroups.component.html',
  styleUrl: './stopgroups.component.css'
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

  divisionFilter = signal<number>(0);

  filteredStops = computed(() => this.filterStopsByDivisionId(this.divisionFilter()));

  async ngOnInit() {
    this.addInfo('info', 'Retrieving Data');
    await this.initialiseData();
  }

  async initialiseData() {
    await this.getDivisions();
    await this.getStopGroups();
    await this.getStops();
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


  /*

  dropGroup(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.stopGroups(), event.previousIndex, event.currentIndex);
    this.hasChanged.set(true);
  }

  // Drag and Drop Function for Stops
  dropStop(event: CdkDragDrop<any[]>) {
    const previousGroupId = parseInt(event.previousContainer.id.split('-')[1]);
    const currentGroupId = parseInt(event.container.id.split('-')[1]);

    this.hasChanged.set(true);
    if (previousGroupId === 0 && currentGroupId === 0) {
      this.dropStopFromUnassignedToUnassigned(event);
    } else if (currentGroupId === 0) {
      this.dropStopFromAssignedToUnassigned(event);
    } else if (previousGroupId !== 0) {
      this.dropStopFromAssignedToAssigned(event);
    } else {
      this.dropStopFromUnassignedToAssigned(event);
    }

    this.addInfo('info', 'Updating Stop');
  }

  dropStopFromUnassignedToUnassigned(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.privateStops(), event.previousIndex, event.currentIndex);
  }

  dropStopFromUnassignedToAssigned(event: CdkDragDrop<any[]>) {
    const stopGroupId = parseInt(event.container.id.split('-')[1]);

    const stop = this.privateStops()[event.previousIndex];
    stop.stopGroupID = stopGroupId;
    this.stopsToUpdate.update(stops => [...stops, stop]);
    transferArrayItem(this.privateStops(), this.stopGroups().find(group => group.stopGroupID === stopGroupId)!.stops, event.previousIndex, event.currentIndex);
  }

  dropStopFromAssignedToUnassigned(event: CdkDragDrop<any[]>) {
    const stopGroupId = parseInt(event.previousContainer.id.split('-')[1]);
    transferArrayItem(this.stopGroups().find(group => group.stopGroupID === stopGroupId)!.stops, this.privateStops(), event.previousIndex, event.currentIndex);
    const stop = this.privateStops()[event.currentIndex];
    stop.stopGroupID = null;
    this.stopsToUpdate.update(stops => [...stops, stop]);
  }

  dropStopFromAssignedToAssigned(event: CdkDragDrop<any[]>) {
    const previousGroupId = parseInt(event.previousContainer.id.split('-')[1]);
    const currentGroupId = parseInt(event.container.id.split('-')[1]);

    const previousStops = this.stopGroups().find(group => group.stopGroupID === previousGroupId)!.stops
    const currentStops = this.stopGroups().find(group => group.stopGroupID === currentGroupId)!.stops
    transferArrayItem(previousStops, currentStops, event.previousIndex, event.currentIndex);
    const stop = currentStops[event.currentIndex];
    stop.stopGroupID = currentGroupId;
    this.stopsToUpdate.update(stops => [...stops, stop]);
  }

  updateOrder() {
    // Update the order of the stops
    const stopOrder = [this.stopGroups().map(group => group.stops).flat().map(stop => stop.stopID), this.privateStops().map(stop => stop.stopID)].flat();
    this.stopFetcher.updateStopOrder(stopOrder);

    // Update the stopGroupID of the stops
    this.stopsToUpdate().forEach(stop => {
      this.stopFetcher.updateStopStopGroupId(stop);
      console.log("Updating stop with ID: " + stop.stopID + " to stopGroupID: " + stop.stopGroupID);
    });
    this.stopsToUpdate.set([]);

    // Update the order of the stopGroups
    const stopGroupOrder = this.stopGroups().map(group => group.stopGroupID);
    this.stopGroupFetcher.updateStopGroupOrder(stopGroupOrder);

    this.hasChanged.set(false);
  }*/

  addInfo(type: string, message: string): void {
    const maxId = this.infos().reduce((max, item) => (item.id > max ? item.id : max), 0);
    const info = {
      id: maxId + 1,
      type: type,
      message: message,
    } as Info;
    this.infos.update(oldInfos => [...oldInfos, info]);
  }

  deleteInfo(index: number) {
    console.log("Deleting info with index: " + index);
    this.infos.update(infos => infos.filter((info) => info.id !== index));
  }

  /*
  getGroupIdFromEvent(event: CdkDragDrop<any[]>): number | null {
    const groupIdString = event.container.id.split('-')[1];
    return groupIdString === null ? null : parseInt(groupIdString);
  }*/

  getDropGroups(): string[] {
    return this.stopGroups().map(group => 'group-' + group.id);
  }

  getStopByStopId(stopId: number): Stop | undefined {
    return this.stops().find(stop => stop.id === stopId);
  }

  dropStop(event: CdkDragDrop<any, any>) {
    if (event.previousContainer.id === 'all-stops') {
      const stopId = this.stops()[event.previousIndex].id;
      if (!event.container.data.includes(stopId)) {
        event.container.data.splice(event.currentIndex, 0, stopId);
      } else {
        console.log("already exists in this stopGroup")
      }
    } else if (event.container === event.previousContainer) {
      moveItemInArray(event.previousContainer.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.hasChanged.set(true);
  }

  dropGroup(event: CdkDragDrop<any, any>) {
    moveItemInArray(this.stopGroups(), event.previousIndex, event.currentIndex);
  }

  filterStopsByDivisionId(divisionId: number): Stop[] {
    if (divisionId === 0) {
      return this.stops();
    }
    this.stops().forEach(stop => console.log(stop));
    console.log("Filtering stops by divisionId: " + divisionId);
    return this.stops().filter(stop => Array.isArray(stop.divisionIds) && stop.divisionIds.includes(divisionId));
  }

  saveChanges() {

  }
}
