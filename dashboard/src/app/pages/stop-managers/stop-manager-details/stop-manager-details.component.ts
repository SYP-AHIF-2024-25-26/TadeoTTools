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
  isConflict,
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

  // Room and student counts per stop, shown on the stop cards. The counts use
  // the same rule as the status column below: a student with more than one
  // open request counts as a conflict.
  stopFacts = computed(() => {
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

    const loaded = this.students() !== null;
    return new Map(
      this.stops().map((stop) => {
        const facts: { text: string; conflict?: boolean }[] = [];
        if (stop.roomNr) facts.push({ text: stop.roomNr });
        if (loaded) {
          const c = counts.get(stop.id);
          if (!c) facts.push({ text: 'No students yet' });
          else {
            if (c.approved) facts.push({ text: `${c.approved} approved` });
            if (c.pending) facts.push({ text: `${c.pending} pending` });
            if (c.conflict)
              facts.push({
                text: `${c.conflict} ${c.conflict === 1 ? 'conflict' : 'conflicts'}`,
                conflict: true,
              });
          }
        }
        return [stop.id, facts] as const;
      })
    );
  });
}
