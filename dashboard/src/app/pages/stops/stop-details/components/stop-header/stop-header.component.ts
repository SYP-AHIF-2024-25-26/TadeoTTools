import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Division, Status, Stop, StopManager } from '@/shared/models/types';
import { statusBadgeClass } from '@/shared/utils/assignment-status';

/** Read-only summary of a stop, so the students below get the attention. */
@Component({
  selector: 'app-stop-header',
  templateUrl: './stop-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopHeaderComponent {
  stop = input.required<Stop>();
  divisions = input.required<Division[]>();
  stopManagers = input.required<StopManager[]>();
  edit = output<void>();

  stopDivisions = computed(() =>
    this.stop()
      .divisionIds.map((id) => this.divisions().find((d) => d.id === id))
      .filter((d): d is Division => d !== undefined)
  );

  managerNames = computed(() => {
    const usernames = new Set(
      this.stop().stopManagerAssignments.map((u) => u.toLowerCase())
    );
    return this.stopManagers()
      .filter((m) => usernames.has(m.edufsUsername.toLowerCase()))
      .map((m) => `${m.firstName} ${m.lastName}`)
      .join(', ');
  });

  pendingCount = computed(() => this.countStudents(Status.Pending));
  approvedCount = computed(() => this.countStudents(Status.Accepted));

  protected readonly pendingClass = statusBadgeClass(Status.Pending);
  protected readonly approvedClass = statusBadgeClass(Status.Accepted);

  private countStudents(status: Status): number {
    return (this.stop().studentAssignments ?? []).filter(
      (a) => a.status === status
    ).length;
  }
}
