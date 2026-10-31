import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { ProgressService } from '@core/services/progress.service';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import {
  CURRENT_STOP_GROUP_PREFIX,
  CURRENT_STOP_PREFIX,
} from '@shared/constants/constants';
import { colorsOfStop } from '@shared/division-colors';
import { Division, MapPlace, Stop, StopGroup } from '@shared/models/types';
import {
  FLOORS,
  floorOf,
  isFloorCode,
  mapRoomOf,
  placeText,
  placeTitle,
} from '@shared/room';
import { MapMarkerComponent } from './map-marker/map-marker.component';
import { PlanViewComponent } from './plan-view/plan-view.component';
import { StopPreviewComponent } from './stop-preview/stop-preview.component';
import { StopRowComponent } from './stop-row/stop-row.component';

/** Below this distance on the screen a finger cannot tell two markers apart. */
const TOUCH_DISTANCE = 30;
/** Clear space a marker keeps above the sheet, including the sheet's own slide in. */
const ABOVE_SHEET = 64;

interface MapRoom {
  place: MapPlace;
  stops: Stop[];
}

/** A line of the directory: one stop, however many rooms of the floor it uses. */
interface DirectoryRow {
  stop: Stop;
  rooms: MapRoom[];
  /** Empty under a line that already names the same place. */
  place: string;
}

const byCode = (a: MapRoom, b: MapRoom) =>
  a.place.code.localeCompare(b.place.code, 'de', { numeric: true });

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  imports: [
    HeaderComponent,
    NavbarComponent,
    PlanViewComponent,
    MapMarkerComponent,
    StopPreviewComponent,
    StopRowComponent,
  ],
  host: {
    '(swipeleft)': 'onSwipeLeft($event)',
    '(swiperight)': 'onSwipeRight($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit {
  /** The stop whose rooms are ringed, from "Auf der Karte". */
  stop = input<string>();
  /** The floor to return to, from the URL. */
  floor = input<string>();

  private router = inject(Router);
  private injector = inject(Injector);
  private api = inject(ApiFetchService);
  protected progress = inject(ProgressService);
  private plan = viewChild.required(PlanViewComponent);
  private sheet = viewChild.required<ElementRef<HTMLDialogElement>>('sheet');
  private scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  protected floors = FLOORS;
  protected floorRail = FLOORS.map((floor, index) => ({
    ...floor,
    index,
  }));

  private places = signal<MapPlace[]>([]);
  private stops = signal<Stop[]>([]);
  private groups = signal<StopGroup[]>([]);
  private divisions = signal<Division[]>([]);
  protected loadFailed = signal(false);
  /** The tapped room first, then what a finger could have meant beside it. */
  protected sheetRooms = signal<MapRoom[]>([]);
  private picked = signal<{ room: MapRoom; stop: Stop } | null>(null);
  /** The room whose name heads the sheet. */
  protected sheetRoom = computed(
    () => this.picked()?.room ?? this.sheetRooms()[0]
  );
  private onlyStop = computed(() => {
    const rooms = this.sheetRooms();
    return rooms.length === 1 && rooms[0].stops.length === 1
      ? rooms[0].stops[0]
      : null;
  });
  protected sheetTitle = computed(() => {
    const room = this.sheetRoom();
    const picked = this.picked();
    return room
      ? placeTitle(room.place, picked ? [picked.stop] : room.stops)
      : '';
  });
  /** The stop in the sheet, shown in short; several are listed as rows. */
  protected previewStop = computed(
    () => this.picked()?.stop ?? this.onlyStop()
  );
  protected canGoBack = computed(() => !this.onlyStop());
  /** The places the open sheet is about: ringed on the plan, so the visitor sees which. */
  private selectedIds = signal(new Set<number>());
  /** Scroll room while the sheet is open, so a marker low on the plan can still clear it. */
  protected sheetSpace = computed(() =>
    this.selectedIds().size > 0 ? '75vh' : null
  );

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

  private askedStop = computed(() =>
    this.stops().find((stop) => stop.id === Number(this.stop()))
  );
  /** The stop's own places; only a stop not placed yet falls back on its room text. */
  private highlightedIds = computed(() => {
    const stop = this.askedStop();
    const linked = this.places().filter(
      (place) => stop && place.stopIds.includes(stop.id)
    );
    const code = mapRoomOf(stop?.roomNr)?.toLowerCase();
    const places = linked.length
      ? linked
      : this.places().filter((place) => place.code.toLowerCase() === code);
    return new Set(places.map((place) => place.id));
  });
  private highlightedFloors = computed(() => {
    const ids = this.highlightedIds();
    return new Set(
      this.places()
        .filter((place) => ids.has(place.id))
        .map((place) => place.floor)
    );
  });

  /** The floor of the URL, else of the stop it asks for; the rail changes it. */
  currentFloor = linkedSignal(() => {
    const fromUrl = FLOORS.findIndex((floor) => floor.code === this.floor());
    if (fromUrl >= 0) {
      return fromUrl;
    }
    if (this.highlightedFloors().size === 0) {
      return floorOf(mapRoomOf(this.askedStop()?.roomNr) ?? undefined);
    }
    return FLOORS.findIndex((floor) =>
      this.highlightedFloors().has(floor.code)
    );
  });
  currentFloorName = computed(() => FLOORS[this.currentFloor()].name);
  /** The asked stop's room in the band; a floor code like "EG" is no room, the band names the floor anyway. */
  roomLabel = computed(() => {
    const stop = this.askedStop();
    if (!stop?.roomNr || isFloorCode(stop.roomNr)) {
      return null;
    }
    const room = this.rooms().find((candidate) =>
      this.highlightedIds().has(candidate.place.id)
    );
    return room ? placeTitle(room.place, [stop]) : `Raum ${stop.roomNr}`;
  });

  private floorRooms = computed(() => {
    const code = FLOORS[this.currentFloor()].code;
    return this.rooms().filter((room) => room.place.floor === code);
  });
  protected markers = computed(() =>
    this.floorRooms()
      .filter((room) => room.stops.length > 0)
      .sort(byCode)
  );
  protected labels = computed(() =>
    this.floorRooms()
      .filter((room) => room.stops.length === 0 && room.place.publicLabel)
      .map((room) => room.place)
  );
  /** The way in by name, for reading and for everyone who cannot use the plan. */
  protected directory = computed<DirectoryRow[]>(() => {
    const rows = new Map<number, DirectoryRow>();
    for (const room of this.markers()) {
      for (const stop of room.stops) {
        const row = rows.get(stop.id);
        if (row) {
          row.rooms.push(room);
        } else {
          rows.set(stop.id, { stop, rooms: [room], place: '' });
        }
      }
    }
    let previous = '';
    return [...rows.values()].map((row) => {
      const texts = row.rooms.map((room) => placeText(room.place, [row.stop]));
      const place = [...new Set(texts)].join(', ');
      const shown = place === previous ? '' : place;
      previous = place;
      return { ...row, place: shown };
    });
  });
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

  /** An open sheet takes over the ring, so the plan shows which marker it is about. */
  protected isHighlighted(place: MapPlace): boolean {
    const selected = this.selectedIds();
    return selected.size > 0
      ? selected.has(place.id)
      : this.highlightedIds().has(place.id);
  }

  protected floorHasHighlight(code: string): boolean {
    return this.highlightedFloors().has(code);
  }

  protected text(room: MapRoom): string {
    return placeText(room.place, room.stops);
  }

  protected markerLabel(room: MapRoom): string {
    const what =
      room.stops.length === 1
        ? room.stops[0].name
        : `${room.stops.length} Stationen`;
    const seen = this.isSeen(room) ? ', gesehen' : '';
    return `${placeTitle(room.place, room.stops)}: ${what}${seen}`;
  }

  /** The sheet decides on the map: one stop in short; a full room, or markers too close, list theirs. */
  protected onMarker(room: MapRoom) {
    const plan = this.plan();
    // A stop in both rooms is named once, under the tapped one.
    const near = this.markers()
      .filter(
        (other) =>
          other !== room &&
          plan.screenDistance(room.place, other.place) < TOUCH_DISTANCE
      )
      .map((other) => ({
        ...other,
        stops: other.stops.filter((stop) => !room.stops.includes(stop)),
      }))
      .filter((other) => other.stops.length > 0);
    this.openSheet([room, ...near], [room]);
  }

  /** The row names its stop, so the sheet opens on it; the plan comes back into view behind. */
  protected onRow(row: DirectoryRow) {
    this.plan().reset();
    this.scroller().nativeElement.scrollTop = 0;
    this.picked.set({ room: row.rooms[0], stop: row.stop });
    this.openSheet([row.rooms[0]], row.rooms);
  }

  protected pick(room: MapRoom, stop: Stop) {
    this.picked.set({ room, stop });
    this.sheet().nativeElement.focus();
  }

  protected backToList() {
    this.picked.set(null);
    this.sheet().nativeElement.focus();
  }

  private openSheet(rooms: MapRoom[], selected: MapRoom[]) {
    this.sheetRooms.set(rooms);
    this.selectedIds.set(new Set(selected.map((room) => room.place.id)));
    this.sheet().nativeElement.showModal();
    // Measured once the sheet shows its content and the page has its scroll room.
    afterNextRender(() => this.keepAboveSheet(selected[0].place), {
      injector: this.injector,
    });
  }

  /** The plan cannot pan at full size, so the page moves the ringed marker clear of the sheet. */
  private keepAboveSheet(place: MapPlace) {
    const sheetTop = this.sheet().nativeElement.getBoundingClientRect().top;
    const covered = this.plan().screenY(place) + ABOVE_SHEET - sheetTop;
    if (covered > 0) {
      const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.scroller().nativeElement.scrollBy({
        top: covered,
        behavior: calm ? 'auto' : 'smooth',
      });
    }
  }

  protected closeSheet() {
    this.sheet().nativeElement.close();
  }

  /** The event comes late: a sheet opened right after keeps its own selection. */
  protected onSheetClosed() {
    if (this.sheet().nativeElement.open) {
      return;
    }
    this.picked.set(null);
    this.selectedIds.set(new Set());
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

  /** Over the plan a swipe drags it and over the sheet it does nothing; it changes the page beside them. */
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
      'app-plan-view, dialog'
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
