import {Component, computed, inject, signal} from '@angular/core';
import {Status, StopGroup} from '../../types';
import {RouterModule} from '@angular/router';
import {FilterComponent} from '../../standard-components/filter/filter.component';
import {StopStore} from '../../store/stop.store';
import {StopGroupStore} from '../../store/stopgroup.store';
import {DivisionStore} from '../../store/division.store';
import {TeacherStore} from '../../store/teacher.store';
import {StudentStore} from '../../store/student.store';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-stops',
  standalone: true,
  imports: [RouterModule, FilterComponent, FormsModule],
  templateUrl: './stops.component.html',
})
export class StopsComponent {
  protected stopStore = inject(StopStore);
  private stopGroupStore = inject(StopGroupStore);
  private teacherStore = inject(TeacherStore);
  private studentStore = inject(StudentStore);
  protected divisionStore = inject(DivisionStore);

  // Filter signals
  divisionFilter = signal<number>(0);
  stopNameSearchTerm = signal<string>('');
  stopGroupFilter = signal<string>('');
  teacherSearchTerm = signal<string>('');


  // Computed properties for filters and data
  uniqueStopGroups = computed(() => {
    const stopGroups = this.stopGroupStore.stopGroups();
    return [...new Set(stopGroups.map(sg => sg.name))].sort();
  });

  filteredStops = computed(() => {
    let stops = this.stopStore.filterStopsByDivisionId(this.divisionFilter());

    // Filter by stop name
    const nameSearch = this.stopNameSearchTerm().toLowerCase();
    if (nameSearch) {
      stops = stops.filter(stop => stop.name.toLowerCase().includes(nameSearch));
    }

    // Filter by stop group
    const stopGroupName = this.stopGroupFilter();
    if (stopGroupName) {
      const stopGroup = this.stopGroupStore.stopGroups().find(sg => sg.name === stopGroupName);
      if (stopGroup) {
        stops = stops.filter(stop => stop.stopGroupIds.includes(stopGroup.id));
      }
    }

    // Filter by teacher
    const teacherSearch = this.teacherSearchTerm().toLowerCase();
    if (teacherSearch) {
      stops = stops.filter(stop => {
        const teachers = this.getTeachersByStopId(stop.id);
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
    return this.stopGroupStore.stopGroups().find((sg) => sg.id === sgId) || null;
  }

  getStopGroupNames(stopGroupIds: number[]): string {
    const names = stopGroupIds
      .map(id => this.getGroupById(id)?.name)
      .filter(name => name)
      .join(', ');
    return names || 'No groups assigned';
  }

  getTeachersByStopId(stopId: number) {
    return this.teacherStore.getTeachersByStopId(stopId);
  }

  getTeacherNames(stopId: number): string {
    const teachers = this.getTeachersByStopId(stopId);
    if (teachers.length === 0) return 'No teachers assigned';
    return teachers.map(t => `${t.firstName} ${t.lastName}`).join(', ');
  }

  getStudentCount(stopId: number): string {
    const students = this.studentStore.getStudentsByStopId(stopId);
    const requested = students.filter(s =>
      s.studentAssignments.some(a => a.stopId === stopId && a.status === Status.Pending)
    ).length;
    const assigned = students.filter(s =>
      s.studentAssignments.some(a => a.stopId === stopId && a.status === Status.Accepted)
    ).length;
    return `${requested} / ${assigned}`;
  }

  getDivisionNames(divisionIds: number[]): string {
    const divisions = this.divisionStore.getDivisions();
    const names = divisionIds
      .map(id => divisions.find(d => d.id === id)?.name)
      .filter(name => name)
      .join(', ');
    return names || 'No departments';
  }

  // Reset filters
  clearFilters(): void {
    this.stopNameSearchTerm.set('');
    this.stopGroupFilter.set('');
    this.teacherSearchTerm.set('');
    this.divisionFilter.set(0);
  }
}
