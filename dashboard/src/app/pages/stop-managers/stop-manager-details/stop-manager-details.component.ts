import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import Keycloak from 'keycloak-js';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StopService } from '@/core/services/stop.service';
import { Status, Stop, StopManager, Student } from '@/shared/models/types';
import {
  activeAssignments,
  CONFLICT_BADGE_CLASS,
  isConflict,
  statusBadgeClass,
} from '@/shared/utils/assignment-status';
import { StopManagerService } from '@/core/services/stop-manager.service';
import { StopManagerStudentsComponent } from './components/stop-manager-students/stop-manager-students.component';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';

@Component({
  selector: 'app-stop-manager-details',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    StopManagerStudentsComponent,
  ],
  templateUrl: './stop-manager-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopManagerDetailsComponent implements OnInit {
  private stopService = inject(StopService);
  private stopManagerService = inject(StopManagerService);
  private scrollService = inject(ScrollPersistenceService);
  stops = signal<Stop[]>([]);
  loading = signal<boolean>(true);
  loadFailed = signal<boolean>(false);
  keycloak = inject(Keycloak);

  // Null until the students list below has loaded them.
  students = signal<Student[] | null>(null);

  username = signal<string>('');
  stopManager = signal<StopManager | null>(null);

  protected readonly approvedClass = statusBadgeClass(Status.Accepted);
  protected readonly pendingClass = statusBadgeClass(Status.Pending);
  protected readonly conflictClass = CONFLICT_BADGE_CLASS;

  async ngOnInit() {
    const userProfile = await this.keycloak.loadUserProfile();
    const username = userProfile.username || '';
    this.username.set(username);
    await this.loadStops();
    try {
      this.stopManager.set(
        await this.stopManagerService.getStopManagerById(username)
      );
    } catch (e) {
      console.error('Failed to load stop manager profile', e);
    }
    this.scrollService.restoreScroll();
  }

  async loadStops() {
    this.loading.set(true);
    this.loadFailed.set(false);
    try {
      this.stops.set(
        await this.stopService.getStopsForStopManager(this.username())
      );
    } catch (e) {
      console.error('Failed to load stops of stop manager', e);
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  // Student counts per stop for the badges on the stop cards. They use the
  // same rule as the status column below: a student with more than one open
  // request counts as a conflict.
  studentCounts = computed(() => {
    const counts = new Map<
      number,
      { approved: number; pending: number; conflict: number }
    >();
    for (const student of this.students() ?? []) {
      const active = activeAssignments(student.studentAssignments ?? []);
      const conflict = isConflict(active);
      for (const a of active) {
        const c = counts.get(a.stopId) ?? {
          approved: 0,
          pending: 0,
          conflict: 0,
        };
        if (conflict) c.conflict++;
        else if (a.status === Status.Accepted) c.approved++;
        else c.pending++;
        counts.set(a.stopId, c);
      }
    }
    return counts;
  });
}
