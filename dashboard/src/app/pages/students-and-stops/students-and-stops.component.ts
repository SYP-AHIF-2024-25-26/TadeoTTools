import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { StopService } from '@/core/services/stop.service';
import { StudentService } from '@/core/services/student.service';
import { HasUnsavedChanges } from '@/core/guards/unsaved-changes.guard';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';
import { ListStudentsComponent } from '../students/student-list/student-list.component';
import { StopGroupsComponent } from '../stop-groups/stop-group-list/stop-group-list.component';
import { StopsComponent } from '../stops/stop-list/stop-list.component';

export type StudentsAndStopsTab = 'students' | 'stopgroups' | 'stops';
const TABS: StudentsAndStopsTab[] = ['students', 'stopgroups', 'stops'];

// Students, the tour (stop groups) and the stops in one place, one tab each. The tab
// is in the URL (`?tab=`) so other pages can link to it; Students has none.
@Component({
  selector: 'app-students-and-stops',
  templateUrl: './students-and-stops.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ListStudentsComponent,
    StopGroupsComponent,
    StopsComponent,
  ],
})
export class StudentsAndStopsComponent implements HasUnsavedChanges {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);
  private studentService = inject(StudentService);
  private stopService = inject(StopService);

  private queryParams = toSignal(this.route.queryParamMap);
  protected readonly tab = computed<StudentsAndStopsTab>(() => {
    const tab = this.queryParams()?.get('tab') as StudentsAndStopsTab | null;
    return tab && TABS.includes(tab) ? tab : 'students';
  });
  protected readonly tabs: { id: StudentsAndStopsTab; label: string }[] = [
    { id: 'students', label: 'Students' },
    { id: 'stopgroups', label: 'Stop Groups' },
    { id: 'stops', label: 'Stops' },
  ];

  // Tab badges; refreshed whenever the tab changes.
  protected studentCount = signal<number | null>(null);
  protected stopCount = signal<number | null>(null);

  private stopGroups = viewChild(StopGroupsComponent);

  constructor() {
    effect(() => {
      this.tab();
      untracked(() => this.loadCounts());
    });
  }

  // Leaving the page (route guard) with an unsaved tour order.
  hasUnsavedChanges(): boolean {
    return this.stopGroups()?.hasUnsavedChanges() ?? false;
  }

  protected async select(tab: StudentsAndStopsTab): Promise<void> {
    if (tab === this.tab()) return;
    if (this.hasUnsavedChanges()) {
      const discard = await this.confirmDialog.confirm({
        title: 'Unsaved Changes',
        message:
          'The tour order has changes that are not saved yet. Switch tabs and discard them?',
        confirmLabel: 'Discard Changes',
        cancelLabel: 'Keep Editing',
      });
      if (!discard) return;
    }
    await this.router.navigate([], {
      relativeTo: this.route,
      // Students is the default tab; other parameters (e.g. ?status=) only belong to it.
      queryParams: tab === 'students' ? {} : { tab },
      replaceUrl: true,
    });
  }

  private async loadCounts(): Promise<void> {
    try {
      const [students, stops] = await Promise.all([
        this.studentService.getStudents(),
        this.stopService.getStops(),
      ]);
      this.studentCount.set(students.length);
      this.stopCount.set(stops.length);
    } catch (error) {
      // Only the badges are missing; each tab shows its own load error.
      console.error('Failed to load the tab counts', error);
    }
  }
}
