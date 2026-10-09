import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { DialogComponent } from '@/shared/components/dialog/dialog.component';
import { Student } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';
import { statusBadgeClass, statusText } from '@/shared/utils/assignment-status';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';

// Shows a student's competing requests. The only decision is which stop
// keeps the student; it is confirmed first and saved by the student list,
// which owns the busy state, error toasts and Undo.
@Component({
  selector: 'app-conflict-details-modal',
  imports: [DialogComponent, DeletePopupComponent],
  templateUrl: './conflict-details-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConflictDetailsModalComponent {
  readonly student = input.required<Student>();
  // Approved students per stop id.
  readonly approvedCounts = input<Map<number, number>>(new Map());
  readonly busy = input<boolean>(false);

  readonly close = output<void>();
  readonly assignHere = output<number>();

  protected readonly statusText = statusText;
  protected readonly statusBadgeClass = statusBadgeClass;

  // Index of the request the admin wants to keep, while confirming.
  readonly confirmIndex = signal<number | null>(null);

  readonly confirmTitle = computed(() => {
    const index = this.confirmIndex();
    if (index === null) return '';
    return `Assign to ${this.student().studentAssignments[index].stopName}?`;
  });

  readonly confirmMessage = computed(() => {
    const index = this.confirmIndex();
    if (index === null) return '';
    const student = this.student();
    const name = `${student.firstName} ${student.lastName}`;
    const kept = student.studentAssignments[index];
    const removed = student.studentAssignments
      .filter((_, i) => i !== index)
      .map(
        (a) =>
          `• ${a.stopName} (requested by ${this.requestedBy(a.stopManagers)})`
      );
    return (
      `${name} will be approved for ${kept.stopName}.\n\n` +
      `${removed.length === 1 ? 'This request' : 'These requests'} will be removed:\n` +
      removed.join('\n')
    );
  });

  approvedText(stopId: number): string {
    return `${plural(this.approvedCounts().get(stopId) ?? 0, 'student')} approved`;
  }

  requestedBy(managers: string[] | undefined): string {
    return managers?.length ? managers.join(', ') : 'no stop manager';
  }

  confirmAssign() {
    const index = this.confirmIndex();
    if (index !== null) {
      this.assignHere.emit(index);
      this.confirmIndex.set(null);
    }
  }

  // Esc closes the confirmation first when it is open on top.
  onEscape() {
    if (this.confirmIndex() === null) {
      this.close.emit();
    }
  }
}
