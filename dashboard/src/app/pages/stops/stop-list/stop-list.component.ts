import {
  Component,
  computed,
  inject,
  signal,
  ViewChild,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import {
  Division,
  Status,
  Stop,
  StopGroup,
  Student,
  StopManager,
  StudentAssignment,
} from '@/shared/models/types';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DivisionService } from '@/core/services/division.service';
import { StopGroupService } from '@/core/services/stopgroup.service';
import { StopService } from '@/core/services/stop.service';
import { StopManagerService } from '@/core/services/stop-manager.service';
import { StudentService } from '@/core/services/student.service';
import { FilterStateService } from '@/core/services/filter-state.service';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';
import { ActionIconComponent } from '@/shared/components/action-icon/action-icon.component';
import { errorText, ToastService } from '@/core/services/toast.service';
import { downloadFile } from '@/shared/utils/utils';

@Component({
  selector: 'app-stops',
  imports: [
    RouterModule,
    FormsModule,
    PageHeaderComponent,
    ActionIconComponent,
  ],
  templateUrl: './stop-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopsComponent {
  private studentService = inject(StudentService);
  private divisionService = inject(DivisionService);
  private stopGroupService = inject(StopGroupService);
  private stopService = inject(StopService);
  private stopManagerService = inject(StopManagerService);
  private scrollService = inject(ScrollPersistenceService);

  // use shared filter state service so filters persist across navigation
  private filterState = inject(FilterStateService);
  private toast = inject(ToastService);
  readonly divisionFilter = this.filterState.divisionFilter;
  readonly stopNameSearchTerm = this.filterState.stopNameSearchTerm;
  readonly stopGroupFilter = this.filterState.stopGroupFilter;
  readonly stopManagerSearchTerm = this.filterState.stopManagerSearchTerm;

  divisions = signal<Division[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  stops = signal<Stop[]>([]);
  stopManagers = signal<StopManager[]>([]);
  students = signal<Student[]>([]);
  showFilters = signal<boolean>(false);

  async ngOnInit() {
    this.stops.set(await this.stopService.getStops());
    this.stopGroups.set(await this.stopGroupService.getStopGroups());
    this.divisions.set(await this.divisionService.getDivisions());
    this.stopManagers.set(await this.stopManagerService.getStopManagers());
    this.students.set(await this.studentService.getStudents());
    this.scrollService.restoreScroll();
  }

  // Computed properties for filters and data
  uniqueStopGroups = computed(() => {
    const stopGroups = this.stopGroups();
    return [...new Set(stopGroups.map((sg) => sg.name))].sort();
  });

  // src/app/pages/stops/stops.component.ts
  filteredStops = computed(() => {
    const divisionId = Number(this.divisionFilter());
    // Guard and coerce divisionIds elements to numbers
    let stops = divisionId
      ? this.stops().filter((stop) =>
          (stop.divisionIds ?? []).some((d) => Number(d) === divisionId)
        )
      : this.stops();

    const nameSearch = this.stopNameSearchTerm().toLowerCase();
    if (nameSearch) {
      stops = stops.filter((stop) =>
        stop.name.toLowerCase().includes(nameSearch)
      );
    }

    const stopGroupName = this.stopGroupFilter();
    if (stopGroupName) {
      const stopGroup = this.stopGroups().find(
        (sg) => sg.name === stopGroupName
      );
      if (stopGroup) {
        stops = stops.filter((stop) =>
          stop.stopGroupIds.includes(stopGroup.id)
        );
      }
    }

    const stopManagerSearch = this.stopManagerSearchTerm().toLowerCase();
    if (stopManagerSearch) {
      stops = stops.filter((stop) => {
        const stopManagers = this.stopManagers().filter((t) =>
          t.assignedStops.includes(stop.id)
        );
        return stopManagers.some(
          (stopManager) =>
            stopManager.firstName.toLowerCase().includes(stopManagerSearch) ||
            stopManager.lastName.toLowerCase().includes(stopManagerSearch) ||
            `${stopManager.firstName} ${stopManager.lastName}`
              .toLowerCase()
              .includes(stopManagerSearch)
        );
      });
    }
    return stops;
  });

  getGroupById(sgId: number): StopGroup | null {
    return this.stopGroups().find((sg) => sg.id === sgId) || null;
  }

  getStopGroupNames(stopGroupIds: number[]): string {
    return stopGroupIds
      .map((id) => this.getGroupById(id)?.name)
      .filter((name) => name)
      .join(', ');
  }

  getStopManagerNames(stopId: number): string {
    const stopManagers = this.stopManagers().filter((t) =>
      t.assignedStops.includes(stopId)
    );
    return stopManagers.map((t) => `${t.firstName} ${t.lastName}`).join(', ');
  }

  // Counted once per student list instead of scanning all students for every
  // table cell.
  private studentCountsByStop = computed(() => {
    const counts = new Map<number, { requested: number; assigned: number }>();
    for (const student of this.students()) {
      for (const a of student.studentAssignments as StudentAssignment[]) {
        const entry = counts.get(a.stopId) ?? { requested: 0, assigned: 0 };
        if (a.status === Status.Pending) entry.requested++;
        if (a.status === Status.Accepted) entry.assigned++;
        counts.set(a.stopId, entry);
      }
    }
    return counts;
  });

  getStudentCounts(stopId: number): { requested: number; assigned: number } {
    return (
      this.studentCountsByStop().get(stopId) ?? { requested: 0, assigned: 0 }
    );
  }

  // The stop's divisions with their colours, for the swatches in the table.
  stopDivisions(divisionIds: number[]): Division[] {
    return divisionIds
      .map((id) => this.divisions().find((d) => d.id === id))
      .filter((division): division is Division => !!division);
  }

  async downloadStopsData() {
    try {
      const blob = await this.stopService.getStopsDataFile();
      downloadFile(blob, 'stops_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(
        errorText(error, 'The stops data could not be downloaded.')
      );
    }
  }

  // Reset filters
  clearFilters(): void {
    this.filterState.clear();
  }
}
