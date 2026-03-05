import { Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Stop, StopGroup } from '@/shared/models/types';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-stop-group-stop-selector',
  standalone: true,
  imports: [FormsModule, DragDropModule],
  templateUrl: './stop-group-stop-selector.component.html',
})
export class StopGroupStopSelectorComponent {
  stopGroup = model.required<StopGroup>();
  allStops = input.required<Stop[]>();

  selectedStopId: number = -1;

  includedStops = computed(() => {
    const stopMap = new Map(this.allStops().map((s) => [s.id, s]));
    return this.stopGroup()
      .stopIds.map((id) => stopMap.get(id))
      .filter((s): s is Stop => s !== undefined);
  });

  availableStops = computed(() => {
    return this.allStops().filter(
      (stop) => !this.stopGroup().stopIds.includes(stop.id)
    );
  });

  drop(event: CdkDragDrop<string[]>) {
    const stopIds = [...this.stopGroup().stopIds];
    moveItemInArray(stopIds, event.previousIndex, event.currentIndex);
    this.stopGroup.update((sg) => ({ ...sg, stopIds }));
  }

  addStop() {
    const stopId = Number(this.selectedStopId);
    if (stopId !== -1) {
      this.stopGroup.update((sg) => ({
        ...sg,
        stopIds: [stopId, ...sg.stopIds],
      }));
      this.selectedStopId = -1;
    }
  }

  removeStop(stopId: number) {
    this.stopGroup.update((sg) => ({
      ...sg,
      stopIds: sg.stopIds.filter((id) => id !== stopId),
    }));
  }
}
