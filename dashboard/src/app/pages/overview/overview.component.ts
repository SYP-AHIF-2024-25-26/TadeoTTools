import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OverviewService } from '@/core/services/overview.service';
import { FeatureFlagService } from '@/core/services/feature-flag.service';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { Overview, OverviewGroup, OverviewStop } from '@/shared/models/types';

// Same fallback as the visitor app's stop cards: a stop without a division.
const NO_DIVISION_COLOR = '#80c076';
// How many names a to-do's explanation lists before it says "and N more".
const NAMES_SHOWN = 5;

type Tone = 'conflict' | 'pending' | 'neutral';

export type Todo = {
  key: string;
  count: number;
  title: string;
  detail: string;
  tone: Tone;
  action: string;
  route: string;
  queryParams?: Record<string, string>;
};

export type Hint = {
  key: string;
  count: number;
  title: string;
  stops: OverviewStop[];
  route: string;
  queryParams?: Record<string, string>;
  linkLabel: string;
};

type TourBlock = {
  group: OverviewGroup | null;
  stops: OverviewStop[];
};

@Component({
  selector: 'app-overview',
  imports: [RouterLink, DatePipe],
  templateUrl: './overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewComponent implements OnInit {
  private overviewService = inject(OverviewService);
  private featureFlagService = inject(FeatureFlagService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  protected readonly shortcuts: {
    label: string;
    route: string;
    queryParams?: Record<string, string>;
  }[] = [
    { label: 'Edit Tour Order', route: '/stopgroups' },
    { label: 'Create Stop', route: '/stop' },
    {
      label: 'Import & Export',
      route: '/data-management',
      queryParams: { tab: 'data' },
    },
    {
      label: 'Stop Managers',
      route: '/data-management',
      queryParams: { tab: 'stop-managers' },
    },
    { label: 'Feedback Questions', route: '/feedback' },
  ];

  overview = signal<Overview | null>(null);
  loading = signal(true);
  loadFailed = signal(false);
  savingCountdown = signal(false);

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    this.loadFailed.set(false);
    try {
      this.overview.set(await this.overviewService.getOverview());
    } catch (e) {
      console.error('Failed to load overview', e);
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private stops = computed(() => this.overview()?.stops ?? []);
  private groups = computed(() => this.overview()?.groups ?? []);

  /** Nothing has been set up yet: show first steps instead of to-dos. */
  firstRun = computed(
    () =>
      this.overview() !== null &&
      this.stops().length === 0 &&
      this.overview()!.students.total === 0
  );

  private visibleStopIds = computed(
    () =>
      new Set(
        this.groups()
          .filter((g) => g.isPublic)
          .flatMap((g) => g.stopIds)
      )
  );

  todos = computed<Todo[]>(() => {
    const overview = this.overview();
    if (!overview) return [];
    const invisible = this.stops().filter(
      (s) => !this.visibleStopIds().has(s.id)
    );
    const emptyGroups = this.groups().filter(
      (g) => g.isPublic && g.stopIds.length === 0
    );
    const todos: Todo[] = [
      {
        key: 'conflict',
        count: overview.students.conflict,
        title:
          word(overview.students.conflict, 'student', 'students') +
          ' with a conflict',
        detail: 'They asked for more than one stop. Assign each to one stop.',
        tone: 'conflict',
        action: 'Resolve',
        route: '/students',
        queryParams: { status: 'conflict' },
      },
      {
        key: 'invisible',
        count: invisible.length,
        title: word(invisible.length, 'stop', 'stops') + ' visitors won’t see',
        detail: 'Not in any public stop group: ' + nameList(invisible) + '.',
        tone: 'neutral',
        action: 'Edit Tour',
        route: '/stopgroups',
      },
      {
        key: 'empty-groups',
        count: emptyGroups.length,
        title:
          word(emptyGroups.length, 'public stop group', 'public stop groups') +
          ' without stops',
        detail: 'Visitors see an empty group: ' + nameList(emptyGroups) + '.',
        tone: 'neutral',
        action: 'Edit Tour',
        route: '/stopgroups',
      },
      {
        key: 'pending',
        count: overview.students.pending,
        title:
          word(
            overview.students.pending,
            'student request',
            'student requests'
          ) + ' waiting',
        detail: 'Each student asked for one stop. Approve or change it.',
        tone: 'pending',
        action: 'Review',
        route: '/students',
        queryParams: { status: 'pending' },
      },
    ];
    return todos.filter((t) => t.count > 0);
  });

  hints = computed<Hint[]>(() => {
    const overview = this.overview();
    if (!overview) return [];
    const stops = this.stops();
    const hints: Hint[] = [
      {
        key: 'no-manager',
        count: 0,
        title: 'without a stop manager',
        stops: stops.filter((s) => s.managerCount === 0),
        route: '/stops',
        linkLabel: 'Stops',
      },
      {
        key: 'no-students',
        count: 0,
        title: 'without an approved student',
        stops: stops.filter((s) => s.approvedStudentCount === 0),
        route: '/stops',
        linkLabel: 'Stops',
      },
      {
        key: 'no-room',
        count: 0,
        title: 'without a room',
        stops: stops.filter((s) => s.roomNr.trim() === ''),
        route: '/stops',
        linkLabel: 'Stops',
      },
      {
        key: 'no-description',
        count: 0,
        title: 'without a description',
        stops: stops.filter((s) => !s.hasDescription),
        route: '/stops',
        linkLabel: 'Stops',
      },
    ];
    return hints
      .map((h) => ({ ...h, count: h.stops.length }))
      .filter((h) => h.count > 0);
  });

  hiddenGroups = computed(() => this.groups().filter((g) => !g.isPublic));

  statusLine = computed(() => {
    const count = this.todos().length;
    if (count === 0) {
      return 'Nothing to do. Every student request is decided and every stop is in the tour.';
    }
    return count === 1
      ? 'One thing to do before the open day.'
      : `${count} things to do before the open day.`;
  });

  studentSegments = computed(() => {
    const s = this.overview()?.students;
    if (!s) return [];
    return [
      {
        key: 'approved',
        label: 'Approved',
        count: s.approved,
        bar: 'bg-green-600 dark:bg-green-500',
        status: 'approved',
      },
      {
        key: 'pending',
        label: 'Pending',
        count: s.pending,
        bar: 'bg-teal-500 dark:bg-teal-400',
        status: 'pending',
      },
      {
        key: 'conflict',
        label: 'Conflict',
        count: s.conflict,
        bar: 'bg-orange-500 dark:bg-orange-400',
        status: 'conflict',
      },
      {
        key: 'unassigned',
        label: 'Unassigned',
        count: s.unassigned,
        bar: 'bg-gray-300 dark:bg-gray-600',
        status: 'unassigned',
      },
    ].map((seg) => ({
      ...seg,
      percent: s.total === 0 ? 0 : (seg.count / s.total) * 100,
    }));
  });

  tour = computed<TourBlock[]>(() => {
    const byId = new Map(this.stops().map((s) => [s.id, s]));
    const grouped = new Set(this.groups().flatMap((g) => g.stopIds));
    const blocks: TourBlock[] = this.groups().map((group) => ({
      group,
      stops: group.stopIds
        .map((id) => byId.get(id))
        .filter((s): s is OverviewStop => s !== undefined),
    }));
    const outside = this.stops().filter((s) => !grouped.has(s.id));
    if (outside.length > 0) {
      blocks.push({ group: null, stops: outside });
    }
    return blocks;
  });

  tourStopCount = computed(() => this.visibleStopIds().size);
  publicGroupCount = computed(
    () => this.groups().filter((g) => g.isPublic).length
  );

  protected readonly word = word;

  /** The stop's exact division colours, side by side like on the visitor's stop cards. */
  tileBackground(stop: OverviewStop): string {
    const colors = stop.divisionColors;
    if (colors.length === 0) return NO_DIVISION_COLOR;
    if (colors.length === 1) return colors[0];
    return `linear-gradient(to right, ${colors.join(', ')})`;
  }

  stopGaps(stop: OverviewStop): string[] {
    const gaps: string[] = [];
    if (stop.managerCount === 0) gaps.push('no stop manager');
    if (stop.approvedStudentCount === 0) gaps.push('no approved student');
    if (stop.roomNr.trim() === '') gaps.push('no room');
    if (!stop.hasDescription) gaps.push('no description');
    return gaps;
  }

  tileLabel(stop: OverviewStop): string {
    const parts = [stop.name];
    if (stop.roomNr.trim() !== '') parts.push(`room ${stop.roomNr}`);
    parts.push(
      plural(stop.approvedStudentCount, 'approved student', 'approved students')
    );
    const gaps = this.stopGaps(stop);
    if (gaps.length > 0) parts.push(gaps.join(', '));
    return parts.join(' · ');
  }

  countdownDate = computed(() => {
    const value = this.overview()?.countdown.value;
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  });

  async toggleCountdown(event: Event) {
    const input = event.target as HTMLInputElement;
    const overview = this.overview();
    if (!overview) return;
    const enable = !overview.countdown.isEnabled;
    // Keep the switch where it was until the change is confirmed and saved.
    input.checked = overview.countdown.isEnabled;

    const confirmed = await this.confirmDialog.confirm(
      enable
        ? {
            title: 'Show the Countdown?',
            message:
              'Visitors will see a countdown to the next open day instead of the tour. Turn this on once the open day is over.',
            confirmLabel: 'Show Countdown',
            tone: 'primary',
          }
        : {
            title: 'Show the Tour?',
            message:
              'Visitors will see the tour with all public stop groups instead of the countdown.',
            confirmLabel: 'Show Tour',
            tone: 'primary',
          }
    );
    if (!confirmed) return;

    this.savingCountdown.set(true);
    try {
      await this.featureFlagService.updateShowCountdown(
        enable,
        overview.countdown.value ?? ''
      );
      this.overview.update((o) =>
        o ? { ...o, countdown: { ...o.countdown, isEnabled: enable } } : o
      );
      this.toast.success(
        enable
          ? 'The countdown is now shown in the visitor app.'
          : 'The tour is now shown in the visitor app.'
      );
    } catch (e) {
      console.error('Failed to update the countdown flag', e);
      this.toast.error(
        errorText(e, 'The countdown setting could not be saved.')
      );
    } finally {
      this.savingCountdown.set(false);
    }
  }
}

function word(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${word(count, one, many)}`;
}

function nameList(items: { name: string }[]): string {
  const names = items.slice(0, NAMES_SHOWN).map((i) => i.name);
  const rest = items.length - names.length;
  return rest > 0 ? `${names.join(', ')} and ${rest} more` : names.join(', ');
}
