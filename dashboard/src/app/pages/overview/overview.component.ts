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

type TourBlock = {
  group: OverviewGroup;
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

  private visibleStopIds = computed(
    () =>
      new Set(
        this.groups()
          .filter((g) => g.isPublic)
          .flatMap((g) => g.stopIds)
      )
  );

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

  /** Public stop groups in tour order. Hidden groups and ungrouped stops are private on purpose. */
  tour = computed<TourBlock[]>(() => {
    const byId = new Map(this.stops().map((s) => [s.id, s]));
    return this.groups()
      .filter((group) => group.isPublic)
      .map((group) => ({
        group,
        stops: group.stopIds
          .map((id) => byId.get(id))
          .filter((s): s is OverviewStop => s !== undefined),
      }));
  });

  tourStopCount = computed(() => this.visibleStopIds().size);

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
    if (stop.roomNr.trim() !== '') parts.push(stop.roomNr);
    parts.push(
      `${stop.approvedStudentCount} approved, ${stop.pendingStudentCount} pending`
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
