import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
  Signal,
  signal,
  ViewChildren,
  WritableSignal,
} from '@angular/core';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { BreadcrumbComponent } from '@pages/main/breadcrumb/breadcrumb.component';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { Division, Stop, StopGroup } from '@shared/models/types';
import { StopCardComponent } from '@pages/main/stop-card/stop-card.component';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { DescriptionContainerComponent } from '@pages/main/description-container/description-container.component';
import {
  CURRENT_STOP_GROUP_PREFIX,
  CURRENT_STOP_PREFIX,
  FINISHED_STOP_GROUPS,
  FINISHED_STOPS,
} from '@shared/constants/constants';

@Component({
  selector: 'app-stop-page',
  imports: [
    HeaderComponent,
    NavbarComponent,
    BreadcrumbComponent,
    StopCardComponent,
    NgClass,
    DescriptionContainerComponent,
  ],
  templateUrl: './stop-page.component.html',
  styleUrl: './stop-page.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopPageComponent {
  protected apiFetchService = inject(ApiFetchService);
  protected router = inject(Router);
  stopGroupId = input.required<string>();
  @ViewChildren(StopCardComponent) stopCards!: StopCardComponent[];
  parentStopGroup = signal<StopGroup>({} as StopGroup);
  stops = signal<Stop[]>([]);
  divisions = signal<Division[]>([]);
  divisionIds: Signal<number[]> = computed(() =>
    Array.from(
      new Set(
        this.stops()
          .flatMap((stop) => stop.divisionIds)
          .sort((a, b) => a - b)
      )
    )
  );

  finishedStops = signal<number[]>([]);
  finishedStopGroups = signal<number[]>([]);

  @HostListener('swiperight')
  onSwipeRight() {
    this.goBack();
  }

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
    this.stops.set(
      await this.apiFetchService.getStopsOfGroup(Number(this.stopGroupId())!)
    );
    this.divisions.set(await this.apiFetchService.getDivisions());

    this.loadProgress();
  }

  loadProgress() {
    const fs = localStorage.getItem(FINISHED_STOPS);
    if (fs) {
      this.finishedStops.set(JSON.parse(fs));
    }
    const fsg = localStorage.getItem(FINISHED_STOP_GROUPS);
    if (fsg) {
      this.finishedStopGroups.set(JSON.parse(fsg));
    }
  }

  getColorsOfStop(stop: Stop) {
    return this.divisions()
      .filter((division) => stop.divisionIds.includes(division.id))
      .map((d) => d.color);
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

  isStopFinished(id: number): boolean {
    return this.finishedStops().includes(id);
  }

  onToggleStop(stopId: number) {
    let currentFinished = this.finishedStops();
    if (currentFinished.includes(stopId)) {
      currentFinished = currentFinished.filter((id) => id !== stopId);
    } else {
      currentFinished = [...currentFinished, stopId];
    }
    this.finishedStops.set(currentFinished);
    localStorage.setItem(FINISHED_STOPS, JSON.stringify(currentFinished));

    // Check function documentation for info about why it is not used
    //this.checkGroupStatus();
  }

  // checkGroupStatus is used to check wether all stops are finished per stopGroup and if so the stopGroupIds get safed to localStorage
  // This is not used at the moment, because we want the user to check the stopGroup itsself and we just display how many stops of each stopGroup are finished. 
  /*checkGroupStatus() {
    const group = this.parentStopGroup();
    // Assuming we have to verify if all stops in THIS group are finished.
    // Ideally we should use group.stopIds but stops() contains the stops that were fetched.
    // Let's rely on this.stops() as the source of truth for "stops in this group".
    const allFinished = this.stops().every((stop) =>
      this.finishedStops().includes(stop.id)
    );

    let currentGroups = this.finishedStopGroups();
    if (allFinished) {
      if (!currentGroups.includes(group.id)) {
        currentGroups = [...currentGroups, group.id];
      }
    } else {
      currentGroups = currentGroups.filter((id) => id !== group.id);
    }
    this.finishedStopGroups.set(currentGroups);
    localStorage.setItem(FINISHED_STOP_GROUPS, JSON.stringify(currentGroups));
  }*/

  getSortedStops() {
    return this.stops().sort(
      (a, b) =>
        a.orders[a.stopGroupIds.indexOf(this.parentStopGroup().id)]! -
        b.orders[b.stopGroupIds.indexOf(this.parentStopGroup().id)]!
    );
  }

  async goBack() {
    await this.router.navigate(['/main']);
  }
}
