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

@Component({
  selector: 'app-stops',
  imports: [RouterModule, FormsModule],
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
    const names = stopGroupIds
      .map((id) => this.getGroupById(id)?.name)
      .filter((name) => name)
      .join(', ');
    return names || 'No groups assigned';
  }

  getStopManagerNames(stopId: number): string {
    const stopManagers = this.stopManagers().filter((t) =>
      t.assignedStops.includes(stopId)
    );
    if (stopManagers.length === 0) return 'No stop managers assigned';
    return stopManagers.map((t) => `${t.firstName} ${t.lastName}`).join(', ');
  }

  getStudentCount(stopId: number): string {
    const students = this.students().filter((s) =>
      s.studentAssignments.some((a: StudentAssignment) => a.stopId === stopId)
    );
    const requested = students.filter((s) =>
      s.studentAssignments.some(
        (a: StudentAssignment) =>
          a.stopId === stopId && a.status === Status.Pending
      )
    ).length;
    const assigned = students.filter((s) =>
      s.studentAssignments.some(
        (a: StudentAssignment) =>
          a.stopId === stopId && a.status === Status.Accepted
      )
    ).length;
    return `${requested} / ${assigned}`;
  }

  getDivisionNames(divisionIds: number[]): string {
    const names = divisionIds
      .map((id) => this.divisions().find((d) => d.id === id)?.name)
      .filter((name) => name)
      .join(', ');
    return names || 'No departments';
  }

  // Reset filters
  clearFilters(): void {
    this.filterState.clear();
  }
}
