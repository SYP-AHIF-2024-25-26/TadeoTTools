import { Injectable, signal } from '@angular/core';
import { StopGroup } from '@shared/models/types';
import {
  CURRENT_STOP_GROUP_PREFIX,
  CURRENT_STOP_PREFIX,
  FINISHED_STOP_GROUPS,
  FINISHED_STOPS,
  STOP_COUNTS,
} from '@shared/constants/constants';

function readIds(key: string): number[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value)
      ? value.filter((id) => typeof id === 'number')
      : [];
  } catch {
    return [];
  }
}

/**
 * The visitor's progress, kept only in this browser. A stop is the unit: a group is seen
 * when all its stops are seen, and ticking a group ticks or unticks all its stops. Only a
 * group without stops is stored as a group.
 */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  readonly finishedStops = signal<number[]>(readIds(FINISHED_STOPS));
  /** Ticked groups that have no stops of their own. */
  readonly finishedStopGroups = signal<number[]>(readIds(FINISHED_STOP_GROUPS));

  isStopSeen(stopId: number): boolean {
    return this.finishedStops().includes(stopId);
  }

  toggleStop(stopId: number) {
    this.setStopsSeen([stopId], !this.isStopSeen(stopId));
  }

  groupProgress(group: StopGroup): number {
    return group.stopIds.filter((id) => this.isStopSeen(id)).length;
  }

  isGroupSeen(group: StopGroup): boolean {
    return group.stopIds.length > 0
      ? group.stopIds.every((id) => this.isStopSeen(id))
      : this.finishedStopGroups().includes(group.id);
  }

  toggleGroup(group: StopGroup) {
    if (group.stopIds.length > 0) {
      this.setStopsSeen(group.stopIds, !this.isGroupSeen(group));
      return;
    }
    const groups = this.finishedStopGroups();
    this.saveGroups(
      groups.includes(group.id)
        ? groups.filter((id) => id !== group.id)
        : [...groups, group.id]
    );
  }

  /**
   * Earlier versions stored a ticked group as a group (and cached the stop counts).
   * Turn such groups into ticks on their stops, so there is only one kind of "seen".
   */
  adoptLegacyGroupTicks(groups: StopGroup[]) {
    const withStops = groups.filter(
      (group) =>
        group.stopIds.length > 0 && this.finishedStopGroups().includes(group.id)
    );
    if (withStops.length > 0) {
      this.setStopsSeen(
        withStops.flatMap((group) => group.stopIds),
        true
      );
      const moved = new Set(withStops.map((group) => group.id));
      this.saveGroups(this.finishedStopGroups().filter((id) => !moved.has(id)));
    }
    localStorage.removeItem(STOP_COUNTS);
  }

  /**
   * Start over on this phone: all ticks and the last opened group and stop go. The stored
   * offline data and the "feedback sent" mark stay.
   */
  reset() {
    this.saveGroups([]);
    this.finishedStops.set([]);
    localStorage.removeItem(FINISHED_STOPS);
    localStorage.removeItem(CURRENT_STOP_GROUP_PREFIX);
    localStorage.removeItem(CURRENT_STOP_PREFIX);
  }

  private setStopsSeen(stopIds: number[], seen: boolean) {
    const rest = this.finishedStops().filter((id) => !stopIds.includes(id));
    const next = seen ? [...rest, ...new Set(stopIds)] : rest;
    this.finishedStops.set(next);
    localStorage.setItem(FINISHED_STOPS, JSON.stringify(next));
  }

  private saveGroups(ids: number[]) {
    this.finishedStopGroups.set(ids);
    localStorage.setItem(FINISHED_STOP_GROUPS, JSON.stringify(ids));
  }
}
