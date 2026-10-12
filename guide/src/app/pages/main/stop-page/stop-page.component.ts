import {
  ChangeDetectionStrategy,
  OnInit,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { DivisionIconComponent } from '@shared/components/division-icon/division-icon.component';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { Division, Stop, StopGroup } from '@shared/models/types';
import { StopCardComponent } from '@pages/main/stop-card/stop-card.component';
import { Router } from '@angular/router';
import { DescriptionContainerComponent } from '@pages/main/description-container/description-container.component';
import { SeenToggleComponent } from '@pages/main/seen-toggle/seen-toggle.component';
import { CardSkeletonComponent } from '@shared/components/load-state/card-skeleton.component';
import { LoadErrorComponent } from '@shared/components/load-state/load-error.component';
import { ProgressService } from '@core/services/progress.service';
import {
  CURRENT_STOP_GROUP_PREFIX,
  CURRENT_STOP_PREFIX,
} from '@shared/constants/constants';
import { colorsOfStop } from '@shared/division-colors';
import { groupCountLine } from '@shared/tour';
import { RoomLineComponent } from '@shared/components/room-line/room-line.component';
import {
  TourBandComponent,
  TourSegment,
} from '@shared/components/tour-band/tour-band.component';

@Component({
  selector: 'app-stop-page',
  imports: [
    HeaderComponent,
    NavbarComponent,
    DivisionIconComponent,
    StopCardComponent,
    DescriptionContainerComponent,
    RoomLineComponent,
    SeenToggleComponent,
    CardSkeletonComponent,
    LoadErrorComponent,
    TourBandComponent,
  ],
  templateUrl: './stop-page.component.html',
  styleUrl: './stop-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(swiperight)': 'goBack()' },
})
export class StopPageComponent implements OnInit {
  protected apiFetchService = inject(ApiFetchService);
  protected router = inject(Router);
  protected progress = inject(ProgressService);
  stopGroupId = input.required<string>();
  parentStopGroup = signal<StopGroup>({} as StopGroup);
  protected loadState = signal<'loading' | 'ready' | 'error'>('loading');
  stops = signal<Stop[]>([]);
  divisions = signal<Division[]>([]);

  protected sortedStops = computed(() => {
    const groupId = this.parentStopGroup().id;
    return [...this.stops()].sort(
      (a, b) =>
        a.orders[a.stopGroupIds.indexOf(groupId)]! -
        b.orders[b.stopGroupIds.indexOf(groupId)]!
    );
  });

  /** Every division of the group's stops, once, in the divisions' own order. */
  protected groupDivisions = computed(() => {
    const ids = new Set(this.stops().flatMap((stop) => stop.divisionIds));
    return this.divisions().filter((division) => ids.has(division.id));
  });

  /** A group with one stop stands for it, so the band shows that stop's room. */
  protected singleRoomNr = computed(() => {
    const stops = this.stops();
    return stops.length === 1 ? stops[0].roomNr : undefined;
  });

  protected metaLine = computed(() => {
    const stops = this.stops();
    return stops.length > 1
      ? groupCountLine(
          stops.filter((stop) => this.progress.isStopSeen(stop.id)).length,
          stops.length
        )
      : '';
  });

  /** The group's progress band in the title band, in the cards' order. */
  protected segments = computed<TourSegment[]>(() =>
    this.sortedStops().map((stop) => ({
      id: stop.id,
      colors: colorsOfStop(stop, this.divisions()),
      seen: this.progress.isStopSeen(stop.id),
    }))
  );

  async ngOnInit() {
    if (this.stopGroupId() === undefined) {
      await this.router.navigate(['/']);
    } else {
      await this.onLoad();
    }
  }

  async onLoad() {
    if (localStorage.getItem(CURRENT_STOP_GROUP_PREFIX) !== null) {
      this.parentStopGroup.set(
        JSON.parse(
          localStorage.getItem(CURRENT_STOP_GROUP_PREFIX)!
        ) as StopGroup
      );
    }
    const groupId = Number(this.stopGroupId());
    this.loadState.set('loading');
    let groups: StopGroup[];
    let stops: Stop[];
    try {
      [groups, stops] = await Promise.all([
        this.apiFetchService.getStopGroups(),
        this.apiFetchService.getStopsOfGroup(groupId),
      ]);
    } catch {
      this.loadState.set('error');
      return;
    }
    // Without divisions the tags and colours are left out; the stops still show.
    const divisions = await this.apiFetchService.getDivisions().catch(() => []);
    // The URL decides the group, not whatever was opened last.
    const group = groups.find((g) => g.id === groupId);
    this.progress.adoptLegacyGroupTicks(groups);
    if (group) {
      this.parentStopGroup.set(group);
      localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(group));
    }
    this.divisions.set(divisions);
    this.stops.set(stops);
    this.loadState.set('ready');
  }

  getColorsOfStop(stop: Stop) {
    return colorsOfStop(stop, this.divisions());
  }

  async openStopDescriptionPage(stop: Stop) {
    localStorage.setItem(CURRENT_STOP_PREFIX, JSON.stringify(stop));
    await this.router.navigate([
      '/tour',
      this.parentStopGroup().id,
      'stop',
      stop.id,
    ]);
  }

  async goBack() {
    await this.router.navigate(['/main']);
  }
}
