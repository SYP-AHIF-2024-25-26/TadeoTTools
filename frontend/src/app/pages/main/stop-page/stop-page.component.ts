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
  STOP_GROUP_PROGRESS_PREFIX,
  STOPS_COUNT_PREFIX,
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

  setProgress() {
    const progress = this.stopCards.filter((stopCard) =>
      stopCard.isChecked()
    ).length;
    localStorage.setItem(
      STOP_GROUP_PROGRESS_PREFIX + this.parentStopGroup().id,
      progress.toString()
    );
    localStorage.setItem(
      STOPS_COUNT_PREFIX + this.parentStopGroup().id,
      this.stops().length.toString()
    );
  }

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
