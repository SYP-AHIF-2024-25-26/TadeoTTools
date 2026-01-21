import { Component, input, output } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
import { Stop, StopGroup } from '@/shared/models/types';

@Component({
  selector: 'app-stop-group-list',
  standalone: true,
  imports: [CdkDropList, CdkDrag, RouterLink],
  templateUrl: './stop-group-list.component.html',
})
export class StopGroupListComponent {
  stopGroups = input.required<StopGroup[]>();
  onlyPublicGroups = input.required<boolean>();
  stops = input.required<Stop[]>();
  connectedDropLists = input.required<string[]>();

  dropGroup = output<CdkDragDrop<any, any>>();
  dropStop = output<CdkDragDrop<any, any>>();
  removeStop = output<{ stopId: number; group: StopGroup }>();

  getStopName(stopId: number): string {
    return this.stops().filter((stop) => stop.id === stopId)[0]?.name || '';
  }
}
