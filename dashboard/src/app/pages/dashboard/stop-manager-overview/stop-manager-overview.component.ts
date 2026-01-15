import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StopManagerService } from '@/core/services/stop-manager.service';
import { StopManager } from '@/shared/models/types';

@Component({
  selector: 'app-stop-manager-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stop-manager-overview.component.html',
})
export class StopManagerOverviewComponent {
  private stopManagerService = inject(StopManagerService);

  stopManagers = signal<StopManager[]>([]);
  editingStopManager = signal<StopManager | null>(null);
  newStopManager = signal<Partial<StopManager>>({});
  searchQuery = signal('');

  filteredStopManagers = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.stopManagers();

    return this.stopManagers().filter(
      (stopManager) =>
        stopManager.edufsUsername.toLowerCase().includes(query) ||
        stopManager.firstName.toLowerCase().includes(query) ||
        stopManager.lastName.toLowerCase().includes(query)
    );
  });

  constructor() {
    this.loadStopManagers();
  }

  async loadStopManagers() {
    try {
      const stopManagers = await this.stopManagerService.getStopManagers();
      this.stopManagers.set(
        stopManagers.sort((a, b) => a.lastName.localeCompare(b.lastName))
      );
    } catch (error) {
      console.error('Failed to load stop managers:', error);
    }
  }

  startEdit(stopManager: StopManager) {
    this.editingStopManager.set({ ...stopManager });
  }

  async saveEdit() {
    if (this.editingStopManager()) {
      try {
        const stopManager = this.editingStopManager()!;
        await this.stopManagerService.updateStopManager({
          edufsUsername: stopManager.edufsUsername,
          firstName: stopManager.firstName,
          lastName: stopManager.lastName,
        });
        await this.loadStopManagers();
        this.editingStopManager.set(null);
      } catch (error) {
        console.error('Failed to update stop manager:', error);
      }
    }
  }

  cancelEdit() {
    this.editingStopManager.set(null);
  }

  async deleteStopManager(edufsUsername: string) {
    try {
      await this.stopManagerService.deleteStopManager(edufsUsername);
      await this.loadStopManagers();
    } catch (error) {
      console.error('Failed to delete stop manager:', error);
    }
  }

  async addStopManager() {
    if (
      this.newStopManager()?.edufsUsername &&
      this.newStopManager()?.firstName &&
      this.newStopManager()?.lastName
    ) {
      try {
        await this.stopManagerService.postStopManager({
          edufsUsername: this.newStopManager().edufsUsername!,
          firstName: this.newStopManager().firstName!,
          lastName: this.newStopManager().lastName!,
        });
        await this.loadStopManagers();
        this.newStopManager.set({});
      } catch (error) {
        console.error('Failed to add stop manager:', error);
      }
    }
  }
}
