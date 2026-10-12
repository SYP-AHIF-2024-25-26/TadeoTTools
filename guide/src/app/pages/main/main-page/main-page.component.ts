import {
  ChangeDetectionStrategy,
  OnInit,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { GuideCardComponent } from '@pages/main/guide-card/guide-card.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { TourSegment } from '@shared/components/tour-band/tour-band.component';
import { CardSkeletonComponent } from '@shared/components/load-state/card-skeleton.component';
import { LoadErrorComponent } from '@shared/components/load-state/load-error.component';
import { Division, Stop, StopGroup } from '@shared/models/types';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { ProgressService } from '@core/services/progress.service';
import { Router } from '@angular/router';
import { CURRENT_STOP_GROUP_PREFIX } from '@shared/constants/constants';
import { openDayLine, upcomingOpenDay } from '@shared/open-day';
import { colorsOfStop } from '@shared/division-colors';
import { stopsInGroupOrder } from '@shared/tour';

@Component({
  selector: 'app-main-page',
  imports: [
    NavbarComponent,
    HeaderComponent,
    GuideCardComponent,
    CardSkeletonComponent,
    LoadErrorComponent,
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(swipeleft)': 'onSwipeLeft()' },
})
export class MainPageComponent implements OnInit {
  private apiFetchService = inject(ApiFetchService);
  private router = inject(Router);
  protected progress = inject(ProgressService);

  protected loadState = signal<'loading' | 'ready' | 'error'>('loading');
  groups = signal<StopGroup[]>([]);
  stops = signal<Stop[]>([]);
  divisions = signal<Division[]>([]);

  /** "Freitag, 20. November 2026, 13–19 Uhr" under the title, from the countdown setting's date. */
  protected dateLine = signal('');

  /** Each group's own band: its stops in group order, in their division colours. */
  protected groupSegments = computed(() => {
    const segments = new Map<number, TourSegment[]>();
    for (const group of this.groups()) {
      segments.set(
        group.id,
        stopsInGroupOrder(group, this.stops()).map((stop) => ({
          id: stop.id,
          colors: colorsOfStop(stop, this.divisions()),
          seen: this.progress.isStopSeen(stop.id),
        }))
      );
    }
    return segments;
  });

  onSwipeLeft() {
    this.router.navigate(['/map']);
  }

  async ngOnInit() {
    void this.loadDateLine();
    await this.onLoad();
  }

  /** Extra: without the setting, or with last year's date, the band shows only the title. */
  private async loadDateLine() {
    try {
      const flag = await this.apiFetchService.getShowCountdown();
      const date = upcomingOpenDay(flag.value);
      this.dateLine.set(date ? openDayLine(date) : '');
    } catch {
      this.dateLine.set('');
    }
  }

  async onLoad() {
    this.loadState.set('loading');
    let groups: StopGroup[];
    try {
      groups = (await this.apiFetchService.getStopGroups()).sort(
        (a, b) => a.order - b.order
      );
    } catch {
      this.loadState.set('error');
      return;
    }
    this.progress.adoptLegacyGroupTicks(groups);
    this.groups.set(groups);
    this.loadState.set('ready');

    // The tour band is extra: without stops or divisions the page still works.
    try {
      const [stops, divisions] = await Promise.all([
        this.apiFetchService.getStops(),
        this.apiFetchService.getDivisions(),
      ]);
      this.divisions.set(divisions);
      this.stops.set(stops);
    } catch {
      this.stops.set([]);
    }
  }

  async openStopPage(stopGroup: StopGroup) {
    localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(stopGroup));
    await this.router.navigate(['/tour', stopGroup.id]);
  }
}
