import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { DivisionIconComponent } from '@shared/components/division-icon/division-icon.component';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { Division, Stop, StopGroup } from '@shared/models/types';
import { StopCardComponent } from '@pages/main/stop-card/stop-card.component';
import { Router, RouterLink } from '@angular/router';
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
import { SwipeNavigatorService } from '@core/services/swipe-navigator.service';

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
    RouterLink,
  ],
  templateUrl: './stop-page.component.html',
  styleUrl: './stop-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(swipeleft)': 'swipeNext()', '(swiperight)': 'swipePrevious()' },
})
export class StopPageComponent {
  protected apiFetchService = inject(ApiFetchService);
  protected router = inject(Router);
  private swipe = inject(SwipeNavigatorService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected progress = inject(ProgressService);
  stopGroupId = input.required<string>();
  parentStopGroup = signal<StopGroup>({} as StopGroup);
  protected loadState = signal<'loading' | 'ready' | 'error'>('loading');
  stops = signal<Stop[]>([]);
  divisions = signal<Division[]>([]);
  /** Every group in tour order, for swiping to the group beside this one. */
  private groups = signal<StopGroup[]>([]);

  private groupIndex = computed(() =>
    this.groups().findIndex((group) => group.id === Number(this.stopGroupId()))
  );
  /** The groups beside this one, for the pager at the bottom: what a swipe does, as buttons. */
  protected previousGroup = computed(() =>
    this.groupIndex() > 0 ? this.groups()[this.groupIndex() - 1] : undefined
  );
  protected nextGroup = computed(() =>
    this.groupIndex() >= 0 ? this.groups()[this.groupIndex() + 1] : undefined
  );
  protected showPager = computed(
    () => this.groupIndex() >= 0 && this.groups().length > 1
  );
  protected positionLine = computed(
    () => `Gruppe ${this.groupIndex() + 1} von ${this.groups().length}`
  );

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

  constructor() {
    // A swipe to the next group reuses this page, so it loads again whenever the URL's group changes.
    effect(() => {
      const id = this.stopGroupId();
      untracked(() => {
        if (id === undefined) {
          void this.router.navigate(['/']);
        } else {
          void this.onLoad();
        }
      });
    });
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
    this.groups.set([...groups].sort((a, b) => a.order - b.order));
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

  /** Like the cards on the start page, in tour order; at the last group the page springs back. */
  protected swipeNext() {
    this.swipeTo(1, 'left');
  }

  protected swipePrevious() {
    this.swipeTo(-1, 'right');
  }

  /** Before the pager opens a group: remember it (as opening from a card does) and go to the top. */
  protected openGroup(group: StopGroup) {
    localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(group));
    window.scrollTo({ top: 0 });
  }

  private swipeTo(step: 1 | -1, direction: 'left' | 'right') {
    const target = step === 1 ? this.nextGroup() : this.previousGroup();
    if (!target) {
      this.swipe.bounce(this.host.nativeElement, direction);
      return;
    }
    localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(target));
    void this.swipe.go(['/tour', target.id], direction);
  }
}
