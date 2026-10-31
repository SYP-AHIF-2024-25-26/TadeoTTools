import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { ProgressService } from '@core/services/progress.service';
import { StopCardComponent } from '@pages/main/stop-card/stop-card.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import {
  CURRENT_STOP_GROUP_PREFIX,
  CURRENT_STOP_PREFIX,
} from '@shared/constants/constants';
import { colorsOfStop } from '@shared/division-colors';
import { Division, MapPlace, Stop, StopGroup } from '@shared/models/types';
import { FLOORS, floorOf, isFloorCode, placeTitle } from '@shared/room';
import { MapMarkerComponent } from './map-marker/map-marker.component';
import { PlanViewComponent } from './plan-view/plan-view.component';

/** Below this distance on the screen a finger cannot tell two markers apart. */
const TOUCH_DISTANCE = 30;

interface MapRoom {
  place: MapPlace;
  stops: Stop[];
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  imports: [
    HeaderComponent,
    NavbarComponent,
    PlanViewComponent,
    MapMarkerComponent,
    StopCardComponent,
  ],
  host: {
    '(swipeleft)': 'onSwipeLeft($event)',
    '(swiperight)': 'onSwipeRight($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
  roomNr = input<string>();
  /** The stop whose rooms are ringed, from "Auf der Karte". */
  stop = input<string>();
  /** The floor to return to, from the URL. */
  floor = input<string>();

  private router = inject(Router);
  private api = inject(ApiFetchService);
  protected progress = inject(ProgressService);
  private plan = viewChild.required(PlanViewComponent);
  private sheet = viewChild.required<ElementRef<HTMLDialogElement>>('sheet');

  protected floors = FLOORS;
  /** Top to bottom, like the building. */
  protected floorRail = FLOORS.map((floor, index) => ({
    ...floor,
    index,
  })).reverse();

  private places = signal<MapPlace[]>([]);
  private stops = signal<Stop[]>([]);
  private groups = signal<StopGroup[]>([]);
  private divisions = signal<Division[]>([]);
  protected loadFailed = signal(false);
  protected sheetRooms = signal<MapRoom[]>([]);

  /** Every place with what shows there: its public stops, or its label. */
  private rooms = computed<MapRoom[]>(() => {
    const stops = new Map(this.stops().map((stop) => [stop.id, stop]));
    return this.places().map((place) => ({
      place,
      stops: place.stopIds
        .map((id) => stops.get(id))
        .filter((stop): stop is Stop => !!stop),
    }));
  });

  private highlightedIds = computed(() => {
    const stopId = Number(this.stop());
    const code = this.roomNr()?.toLowerCase();
    return new Set(
      this.places()
        .filter(
          (place) =>
            place.stopIds.includes(stopId) || place.code.toLowerCase() === code
        )
        .map((place) => place.id)
    );
  });
  private highlightedFloors = computed(() => {
    const ids = this.highlightedIds();
    return new Set(
      this.places()
        .filter((place) => ids.has(place.id))
        .map((place) => place.floor)
    );
  });

  /** The floor of the URL, else of the room it asks for; the rail changes it. */
  currentFloor = linkedSignal(() => {
    const fromUrl = FLOORS.findIndex((floor) => floor.code === this.floor());
    if (fromUrl >= 0) {
      return fromUrl;
    }
    const asked = floorOf(this.roomNr());
    if (this.roomNr() || this.highlightedFloors().size === 0) {
      return asked;
    }
    return FLOORS.findIndex((floor) =>
      this.highlightedFloors().has(floor.code)
    );
  });
  currentFloorName = computed(() => FLOORS[this.currentFloor()].name);
  /** "Raum E24" in the band; a floor code like "EG" is no room, the panel heading names the floor. */
  roomLabel = computed(() => {
    const room = this.roomNr();
    return room && !isFloorCode(room) ? room : null;
  });

  private floorRooms = computed(() => {
    const code = FLOORS[this.currentFloor()].code;
    return this.rooms().filter((room) => room.place.floor === code);
  });
  protected markers = computed(() =>
    this.floorRooms().filter((room) => room.stops.length > 0)
  );
  protected labels = computed(() =>
    this.floorRooms()
      .filter((room) => room.stops.length === 0 && room.place.publicLabel)
      .map((room) => room.place)
  );
  /** The list under the plan, for reading and for everyone who cannot use the plan. */
  protected floorList = computed(() =>
    [...this.markers()].sort((a, b) =>
      a.place.code.localeCompare(b.place.code, 'de', { numeric: true })
    )
  );
  /** A stop in two rooms of this floor is listed once. */
  protected floorStops = computed(() => [
    ...new Map(
      this.floorList()
        .flatMap((room) => room.stops)
        .map((stop) => [stop.id, stop])
    ).values(),
  ]);
  protected hasMarkers = computed(() =>
    this.places().some((p) => p.stopIds.length)
  );

  async ngOnInit() {
    await this.load();
  }

  protected async load() {
    this.loadFailed.set(false);
    try {
      const [places, stops, groups, divisions] = await Promise.all([
        this.api.getMapPlaces(),
        this.api.getStops(),
        this.api.getStopGroups(),
        this.api.getDivisions().catch(() => []),
      ]);
      this.stops.set(stops);
      this.groups.set(groups);
      this.divisions.set(divisions);
      this.places.set(places);
    } catch {
      this.loadFailed.set(true);
    }
  }

  protected colorsOf(room: MapRoom): string[] {
    const divisionIds = [
      ...new Set(room.stops.flatMap((stop) => stop.divisionIds)),
    ];
    return colorsOfStop({ divisionIds } as Stop, this.divisions());
  }

  protected colorsOfStop(stop: Stop): string[] {
    return colorsOfStop(stop, this.divisions());
  }

  protected isSeen(room: MapRoom): boolean {
    return room.stops.every((stop) => this.progress.isStopSeen(stop.id));
  }

  protected isHighlighted(place: MapPlace): boolean {
    return this.highlightedIds().has(place.id);
  }

  protected floorHasHighlight(code: string): boolean {
    return this.highlightedFloors().has(code);
  }

  protected title(place: MapPlace): string {
    return placeTitle(place);
  }

  protected markerLabel(room: MapRoom): string {
    const what =
      room.stops.length === 1
        ? room.stops[0].name
        : `${room.stops.length} Stationen`;
    return `${placeTitle(room.place)}: ${what}`;
  }

  /** One stop opens directly; a full room, or markers too close to tell apart, list theirs. */
  protected onMarker(room: MapRoom) {
    const plan = this.plan();
    const near = this.markers().filter(
      (other) =>
        other === room ||
        plan.screenDistance(room.place, other.place) < TOUCH_DISTANCE
    );
    if (near.length === 1 && room.stops.length === 1) {
      this.openStop(room.stops[0]);
      return;
    }
    this.sheetRooms.set(near);
    this.sheet().nativeElement.showModal();
  }

  protected closeSheet() {
    this.sheet().nativeElement.close();
  }

  /** A tap on the scrim is a tap on the dialog itself. */
  protected onSheetClick(event: MouseEvent) {
    if (event.target === this.sheet().nativeElement) {
      this.closeSheet();
    }
  }

  /** Under its first group of the tour, which the stop page needs for its back link. */
  protected async openStop(stop: Stop) {
    const group = this.groups()
      .filter((candidate) => stop.stopGroupIds.includes(candidate.id))
      .sort((a, b) => a.order - b.order)[0];
    if (!group) {
      return;
    }
    this.closeSheet();
    localStorage.setItem(CURRENT_STOP_PREFIX, JSON.stringify(stop));
    localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(group));
    await this.router.navigate(['/tour', group.id, 'stop', stop.id]);
  }

  /** Over the plan a swipe drags it; it only changes the page beside the plan. */
  onSwipeLeft(event?: Event) {
    if (!this.onPlan(event)) {
      this.router.navigate(['/feedback']);
    }
  }

  onSwipeRight(event?: Event) {
    if (!this.onPlan(event)) {
      this.router.navigate(['/main']);
    }
  }

  private onPlan(event?: Event): boolean {
    return !!(event as unknown as HammerInput | undefined)?.target?.closest(
      'app-plan-view'
    );
  }

  /** Kept in the URL, so coming back from a stop returns to this floor. */
  protected selectFloor(index: number) {
    this.currentFloor.set(index);
    this.router.navigate([], {
      queryParams: { floor: FLOORS[index].code },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Back to the stop; opened from a shared link or after a reload there is no stop to go back to. */
  onGoBack() {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      window.history.back();
    } else {
      this.router.navigate(['/main']);
    }
  }
}
