import { Component, computed, inject, signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import {Division, Status, Stop, StopGroup, Student, Teacher} from '../../types';
import {RouterModule} from '@angular/router';
import {FilterComponent} from '../../standard-components/filter/filter.component';
import {FormsModule} from '@angular/forms';
import { DivisionService } from '../../division.service';
import { StopGroupService } from '../../stopgroup.service';
import { StopService } from '../../stop.service';
import { TeacherService } from '../../teacher.service';
import { StudentService } from '../../student.service';
import { FilterStateService } from '../../state/filter-state.service';

@Component({
  selector: 'app-stops',
  standalone: true,
  imports: [RouterModule, FilterComponent, FormsModule],
  templateUrl: './stops.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopsComponent {
  @ViewChild('divisionFilterComponent') divisionFilterComponent!: FilterComponent;

  private studentService = inject(StudentService);
  private divisionService = inject(DivisionService);
  private stopGroupService = inject(StopGroupService);
  private stopService = inject(StopService);
  private teacherService = inject(TeacherService);

  // use shared filter state service so filters persist across navigation
  private filterState = inject(FilterStateService);
  readonly divisionFilter = this.filterState.divisionFilter;
  readonly stopNameSearchTerm = this.filterState.stopNameSearchTerm;
  readonly stopGroupFilter = this.filterState.stopGroupFilter;
  readonly teacherSearchTerm = this.filterState.teacherSearchTerm;

  divisions = signal<Division[]>([]);
  stopGroups = signal<StopGroup[]>([]);
  stops = signal<Stop[]>([]);
  teachers = signal<Teacher[]>([]);
  students = signal<Student[]>([]);

  async ngOnInit() {
    this.stops.set(await this.stopService.getStops());
    this.stopGroups.set(await this.stopGroupService.getStopGroups());
    this.divisions.set(await this.divisionService.getDivisions());
    this.teachers.set(await this.teacherService.getTeachers());
    this.students.set(await this.studentService.getStudents());
  }

  // Computed properties for filters and data
  uniqueStopGroups = computed(() => {
    const stopGroups = this.stopGroups();
    return [...new Set(stopGroups.map(sg => sg.name))].sort();
  });

  // src/app/pages/stops/stops.component.ts
  filteredStops = computed(() => {
    const divisionId = Number(this.divisionFilter());
    // Guard and coerce divisionIds elements to numbers
    let stops = divisionId
      ? this.stops().filter(stop => (stop.divisionIds ?? []).some(d => Number(d) === divisionId))
      : this.stops();

    const nameSearch = this.stopNameSearchTerm().toLowerCase();
    if (nameSearch) {
      stops = stops.filter(stop => stop.name.toLowerCase().includes(nameSearch));
    }

    const stopGroupName = this.stopGroupFilter();
    if (stopGroupName) {
      const stopGroup = this.stopGroups().find(sg => sg.name === stopGroupName);
      if (stopGroup) {
        stops = stops.filter(stop => stop.stopGroupIds.includes(stopGroup.id));
      }
    }

    const teacherSearch = this.teacherSearchTerm().toLowerCase();
    if (teacherSearch) {
      stops = stops.filter(stop => {
        const teachers = this.teachers().filter(t => t.assignedStops.includes(stop.id));
        return teachers.some(teacher =>
          teacher.firstName.toLowerCase().includes(teacherSearch) ||
          teacher.lastName.toLowerCase().includes(teacherSearch) ||
          `${teacher.firstName} ${teacher.lastName}`.toLowerCase().includes(teacherSearch)
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
      .map(id => this.getGroupById(id)?.name)
      .filter(name => name)
      .join(', ');
    return names || 'No groups assigned';
  }

  getTeacherNames(stopId: number): string {
    const teachers = this.teachers().filter(t => t.assignedStops.includes(stopId));
    if (teachers.length === 0) return 'No teachers assigned';
    return teachers.map(t => `${t.firstName} ${t.lastName}`).join(', ');
  }

  getStudentCount(stopId: number): string {
    const students = this.students().filter(s => s.studentAssignments.some(a => a.stopId === stopId));
    const requested = students.filter(s =>
      s.studentAssignments.some(a => a.stopId === stopId && a.status === Status.Pending)
    ).length;
    const assigned = students.filter(s =>
      s.studentAssignments.some(a => a.stopId === stopId && a.status === Status.Accepted)
    ).length;
    return `${requested} / ${assigned}`;
  }

  getDivisionNames(divisionIds: number[]): string {
    const names = divisionIds
      .map(id => this.divisions().find(d => d.id === id)?.name)
      .filter(name => name)
      .join(', ');
    return names || 'No departments';
  }

  // Reset filters
  clearFilters(): void {
    this.divisionFilterComponent.clearFilter();
    this.filterState.clear();
  }
}
