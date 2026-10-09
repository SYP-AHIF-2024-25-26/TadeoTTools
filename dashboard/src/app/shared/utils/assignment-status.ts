import { Status, StudentAssignment } from '@/shared/models/types';

// One place for how assignment states are named and coloured, so the student
// list, the conflict dialog, the stop editor and the stops table agree.
// Pending is teal: close to Approved (green), clearly apart from Conflict (orange).
// The dashboard no longer rejects requests (duplicates are deleted instead);
// "Rejected" only labels assignments stored before that change.

export function statusText(status: Status): string {
  switch (status) {
    case Status.Accepted:
      return 'Approved';
    case Status.Declined:
      return 'Rejected';
    default:
      return 'Pending';
  }
}

/** Coloured text, e.g. in table cells. */
export function statusTextClass(status: Status): string {
  switch (status) {
    case Status.Accepted:
      return 'font-bold text-green-700 dark:text-green-400';
    case Status.Declined:
      return 'font-bold text-red-700 dark:text-red-400';
    default:
      return 'font-bold text-teal-700 dark:text-teal-400';
  }
}

/** Pill badge background and text. */
export function statusBadgeClass(status: Status): string {
  switch (status) {
    case Status.Accepted:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case Status.Declined:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
  }
}

export const CONFLICT_TEXT_CLASS =
  'font-bold text-orange-700 dark:text-orange-400';
export const CONFLICT_BADGE_CLASS =
  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
export const UNASSIGNED_TEXT_CLASS = 'font-bold text-ink-muted';

/** Assignments that still count: pending or approved (old rejected ones don't). */
export function activeAssignments(
  assignments: StudentAssignment[]
): StudentAssignment[] {
  return assignments.filter((a) => a.status !== Status.Declined);
}

/** A conflict is more than one assignment that still counts. */
export function isConflict(assignments: StudentAssignment[]): boolean {
  return activeAssignments(assignments).length > 1;
}

/**
 * The assignment a student's row acts on when there is no conflict: the one
 * active assignment, or the first old rejected one if nothing else is left.
 */
export function primaryAssignmentIndex(
  assignments: StudentAssignment[]
): number {
  const active = assignments.findIndex((a) => a.status !== Status.Declined);
  return active >= 0 ? active : 0;
}
