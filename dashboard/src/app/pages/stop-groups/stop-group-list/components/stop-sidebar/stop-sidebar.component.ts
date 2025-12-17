import { Component, input, output } from '@angular/core';
import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { RouterLink } from '@angular/router';
import { Division, Stop } from '@/shared/models/types';
import { FilterComponent } from '@/shared/components/filter-bar/filter-bar.component';

@Component({
  selector: 'app-stop-sidebar',
  standalone: true,
  imports: [CdkDropList, CdkDrag, RouterLink, FilterComponent],
  templateUrl: './stop-sidebar.component.html',
})
export class StopSidebarComponent {
  filteredStops = input.required<Stop[]>();
  divisions = input.required<Division[]>();
  showAssignedStops = input.required<boolean>();
  connectedDropLists = input.required<string[]>();

  filterChange = output<number>();
  toggleShowAssignedStops = output<void>();
}
