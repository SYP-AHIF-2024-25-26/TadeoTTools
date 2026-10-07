import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Status, Student } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';
import { statusBadgeClass, statusText } from '@/shared/utils/assignment-status';

// Shows a student's competing requests. Saving happens in the student list,
// which owns the busy state, error toasts and Undo.
@Component({
  selector: 'app-conflict-details-modal',
  imports: [CdkTrapFocus],
  templateUrl: './conflict-details-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'close.emit()' },
})
export class ConflictDetailsModalComponent {
  readonly student = input.required<Student>();
  // Approved students per stop id.
  readonly approvedCounts = input<Map<number, number>>(new Map());
  readonly busy = input<boolean>(false);

  readonly close = output<void>();
  readonly assignHere = output<number>();
  readonly setStatus = output<{ index: number; status: Status }>();
  readonly remove = output<number>();

  protected readonly Status = Status;
  protected readonly statusText = statusText;
  protected readonly statusBadgeClass = statusBadgeClass;

  approvedText(stopId: number): string {
    return `${plural(this.approvedCounts().get(stopId) ?? 0, 'student')} approved`;
  }

  requestedBy(managers: string[] | undefined): string {
    return managers?.length ? managers.join(', ') : 'No stop manager';
  }
}
