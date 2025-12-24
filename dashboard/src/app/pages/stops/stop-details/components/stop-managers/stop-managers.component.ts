import { Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Stop, StopManager } from '@/shared/models/types';

@Component({
  selector: 'app-stop-managers',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './stop-managers.component.html',
})
export class StopManagersComponent {
  stop = model.required<Stop>();
  stopManagers = input.required<StopManager[]>();
  isAdmin = input.required<boolean>();

  assignedStopManagerFilterText = signal<string>('');
  availableStopManagerFilterText = signal<string>('');
  isExpanded = signal<boolean>(true);

  toggle() {
    this.isExpanded.update((v) => !v);
  }

  stopManagersAssignedToStop = computed(() => {
    return this.stop().stopManagerAssignments
      ? this.stop()
          .stopManagerAssignments.map((a) =>
            this.stopManagers().find((t) => t.edufsUsername === a)
          )
          .filter((t): t is StopManager => t !== undefined)
      : [];
  });

  stopManagersAvailableForAssignment = computed(() => {
    const assignedStopManagers = this.stopManagersAssignedToStop();
    return this.stopManagers().filter(
      (stopManager) => !assignedStopManagers.includes(stopManager)
    );
  });

  private applyStopManagerFilters(stopManagers: any[], filterText: string) {
    let filteredStopManagers = stopManagers;

    if (filterText.trim() !== '') {
      const searchText = filterText.toLowerCase().trim();
      filteredStopManagers = filteredStopManagers.filter(
        (stopManager) =>
          stopManager.firstName.toLowerCase().includes(searchText) ||
          stopManager.lastName.toLowerCase().includes(searchText) ||
          stopManager.edufsUsername.toLowerCase().includes(searchText)
      );
    }

    return filteredStopManagers;
  }

  filteredAssignedStopManagers = computed(() => {
    return this.applyStopManagerFilters(
      this.stopManagersAssignedToStop(),
      this.assignedStopManagerFilterText()
    );
  });

  stopManagersNotInStop = computed(() => {
    return this.applyStopManagerFilters(
      this.stopManagersAvailableForAssignment(),
      this.availableStopManagerFilterText()
    );
  });

  addStopManager(edufsUsername: string) {
    this.stop.update((stop) => ({
      ...stop,
      stopManagerAssignments: [
        ...(stop.stopManagerAssignments || []),
        edufsUsername,
      ],
    }));
  }

  removeStopManager(edufsUsername: string) {
    this.stop.update((stop) => ({
      ...stop,
      stopManagerAssignments: (stop.stopManagerAssignments || []).filter(
        (a) => a !== edufsUsername
      ),
    }));
  }
}
