import { Component, computed, inject, Input, signal, ViewChildren, WritableSignal } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { ApiFetchService } from '../api-fetch.service';
import { Division, Stop, StopGroup } from '../types';
import { StopCardComponent } from '../stop-card/stop-card.component';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { DescriptionContainerComponent } from '../description-container/description-container.component';
import { CURRENT_STOP_GROUP_PREFIX, CURRENT_STOP_PREFIX, STOP_GROUP_PROGRESS_PREFIX, STOPS_COUNT_PREFIX } from '../constants';

@Component({
  selector: 'app-stop-page',
  standalone: true,
  imports: [HeaderComponent, NavbarComponent, BreadcrumbComponent, StopCardComponent, NgClass, DescriptionContainerComponent],
  templateUrl: './stop-page.component.html',
  styleUrl: './stop-page.component.css',
})
export class StopPageComponent {
  protected apiFetchService = inject(ApiFetchService);
  protected router = inject(Router);
  @Input({ required: true }) stopGroupId!: string;
  @ViewChildren(StopCardComponent) stopCards!: StopCardComponent[];
  parentStopGroup: WritableSignal<StopGroup> = signal({} as StopGroup);
  stops: WritableSignal<Stop[]> = signal([]);
  divisions: WritableSignal<Division[]> = signal([]);
  divisionIds = computed(() => Array.from(new Set(this.stops().map((stop) => stop.divisionID))).sort((a, b) => a - b));

  async ngOnInit() {
    if (this.stopGroupId === undefined) {
      await this.router.navigate(['/']);
    } else {
      await this.onLoad();
    }
  }

  async onLoad() {
    if (sessionStorage.getItem(CURRENT_STOP_GROUP_PREFIX) !== null) {
      this.parentStopGroup.set(JSON.parse(sessionStorage.getItem(CURRENT_STOP_GROUP_PREFIX)!) as StopGroup);
    }
    this.stops.set(await this.apiFetchService.getStopsOfGroup(Number(this.stopGroupId)!));
    this.divisions.set(await this.apiFetchService.getDivisions());
  }

  getColorOfStop(stop: Stop) {
    return this.divisions().find((division) => division.divisionID === stop.divisionID)?.color;
  }

  async openStopDescriptionPage(stop: Stop) {
    sessionStorage.setItem(CURRENT_STOP_PREFIX, JSON.stringify(stop));
    await this.router.navigate(['/tour', this.parentStopGroup().stopGroupID, 'stop', stop.stopID]);
  }

  setProgress() {
    const progress = this.stopCards.filter((stopCard) => stopCard.isChecked()).length;
    sessionStorage.setItem(STOP_GROUP_PROGRESS_PREFIX + this.parentStopGroup().stopGroupID, progress.toString());
    sessionStorage.setItem(STOPS_COUNT_PREFIX + this.parentStopGroup().stopGroupID, this.stops().length.toString());
  }
}
