import {
  ChangeDetectionStrategy,
  OnInit,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DescriptionContainerComponent } from '@pages/main/description-container/description-container.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DivisionIconComponent } from '@shared/components/division-icon/division-icon.component';
import { Router, RouterLink } from '@angular/router';
import { Division, Stop, StopGroup } from '@shared/models/types';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { ProgressService } from '@core/services/progress.service';
import { SeenToggleComponent } from '@pages/main/seen-toggle/seen-toggle.component';
import { RoomLineComponent } from '@shared/components/room-line/room-line.component';
import {
  CURRENT_STOP_GROUP_PREFIX,
  CURRENT_STOP_PREFIX,
} from '@shared/constants/constants';
import { stopsInGroupOrder } from '@shared/tour';

@Component({
  selector: 'app-stop-description-page',
  imports: [
    DescriptionContainerComponent,
    HeaderComponent,
    DivisionIconComponent,
    NavbarComponent,
    SeenToggleComponent,
    RoomLineComponent,
    RouterLink,
  ],
  templateUrl: './stop-description-page.component.html',
  styleUrl: './stop-description-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(swiperight)': 'goBack()' },
})
export class StopDescriptionPageComponent implements OnInit {
  private router = inject(Router);
  private apiFetchService = inject(ApiFetchService);
  protected progress = inject(ProgressService);

  stopGroupId = input.required<string>();
  stopId = input.required<string>();
  private storedStop = signal({} as Stop);
  currentStopGroup = signal({} as StopGroup);
  divisions = signal<Division[]>([]);
  /** The group's stops in its order, for the back and next links at the bottom. */
  private groupStops = signal<Stop[]>([]);

  /** The stop of the URL; the pager reuses this page, so it follows the route input. */
  stop = computed(
    () =>
      this.groupStops().find((stop) => stop.id === Number(this.stopId())) ??
      this.storedStop()
  );

  private position = computed(() =>
    this.groupStops().findIndex((stop) => stop.id === this.stop().id)
  );
  protected previousStop = computed(() =>
    this.position() > 0 ? this.groupStops()[this.position() - 1] : undefined
  );
  protected nextStop = computed(() =>
    this.position() >= 0 ? this.groupStops()[this.position() + 1] : undefined
  );
  protected showPager = computed(
    () => this.position() >= 0 && this.groupStops().length > 1
  );

  protected stopDivisions = computed(() =>
    (this.stop().divisionIds ?? [])
      .map((id) => this.divisions().find((division) => division.id === id))
      .filter((division): division is Division => !!division)
  );
  /** The icons stay in the header only when there is no description card to hold them. */
  protected headerDivisions = computed(() =>
    this.stop().description ? [] : this.stopDivisions()
  );

  async ngOnInit() {
    if (
      localStorage.getItem(CURRENT_STOP_PREFIX) === null ||
      localStorage.getItem(CURRENT_STOP_GROUP_PREFIX) === null
    ) {
      await this.router.navigate(['/']);
    } else {
      await this.onLoad();
    }
  }

  async onLoad() {
    this.storedStop.set(
      JSON.parse(localStorage.getItem(CURRENT_STOP_PREFIX)!) as Stop
    );
    this.currentStopGroup.set(
      JSON.parse(localStorage.getItem(CURRENT_STOP_GROUP_PREFIX)!) as StopGroup
    );
    const groupId = Number(this.stopGroupId());
    const [divisions, stops] = await Promise.all([
      // Without divisions the icons are left out; name, room and text still show.
      this.apiFetchService.getDivisions().catch(() => []),
      // Without the group's stops there is no pager; the stop itself still shows.
      this.apiFetchService.getStopsOfGroup(groupId).catch(() => []),
    ]);
    this.divisions.set(divisions);
    this.groupStops.set(stopsInGroupOrder({ id: groupId } as StopGroup, stops));
  }

  /** Before the pager opens a stop: remember it (as opening from a card does) and go to the top. */
  protected openStop(stop: Stop) {
    localStorage.setItem(CURRENT_STOP_PREFIX, JSON.stringify(stop));
    window.scrollTo({ top: 0 });
  }

  async goBack() {
    await this.router.navigate(['/tour', this.stopGroupId()]);
  }
}
