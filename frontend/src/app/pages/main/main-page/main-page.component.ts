import {
  Component,
  HostListener,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { GuideCardComponent } from '@pages/main/guide-card/guide-card.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { StopGroup } from '@shared/models/types';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { Router } from '@angular/router';
import {
  CURRENT_STOP_GROUP_PREFIX,
  FINISHED_STOP_GROUPS,
  FINISHED_STOPS,
  STOP_COUNTS,
} from '@shared/constants/constants';

@Component({
  selector: 'app-main-page',
  imports: [NavbarComponent, HeaderComponent, GuideCardComponent],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css',
  standalone: true,
})
export class MainPageComponent {
  private apiFetchService = inject(ApiFetchService);
  private router = inject(Router);
  groups: WritableSignal<StopGroup[]> = signal([]);
  showResetButton: WritableSignal<boolean> = signal(false);

  finishedStops = signal<number[]>([]);
  finishedStopGroups = signal<number[]>([]);
  stopCounts = signal<Record<number, number>>({});

  @HostListener('swipeleft')
  onSwipeRight() {
    this.router.navigate(['/map']);
  }

  async ngOnInit() {
    await this.onLoad();
  }

  async onLoad() {
    const groups = (await this.apiFetchService.getStopGroups()).sort(
      (a, b) => a.rank - b.rank
    );
    this.groups.set(groups);
    this.showResetButton.set(true);

    if (localStorage.getItem(STOP_COUNTS) === null) {
      const counts: Record<number, number> = {};
      groups.forEach((group) => {
        counts[group.id] = group.stopIds.length;
      });
      localStorage.setItem(STOP_COUNTS, JSON.stringify(counts));
      this.stopCounts.set(counts);
    } else {
      this.stopCounts.set(JSON.parse(localStorage.getItem(STOP_COUNTS)!));
    }

    const fs = localStorage.getItem(FINISHED_STOPS);
    if (fs) {
      this.finishedStops.set(JSON.parse(fs));
    }
    const fsg = localStorage.getItem(FINISHED_STOP_GROUPS);
    if (fsg) {
      this.finishedStopGroups.set(JSON.parse(fsg));
    }
  }

  getGroupProgress(group: StopGroup): number {
    // Count how many stops in this group are finished
    return group.stopIds.filter((id) => this.finishedStops().includes(id))
      .length;
  }

  getGroupTotal(group: StopGroup): number {
    return this.stopCounts()[group.id] ?? group.stopIds.length;
  }

  isGroupFinished(group: StopGroup): boolean {
    return this.finishedStopGroups().includes(group.id);
  }

  onToggleGroup(group: StopGroup) {
    let currentGroups = this.finishedStopGroups();
    if (currentGroups.includes(group.id)) {
      currentGroups = currentGroups.filter((id) => id !== group.id);
    } else {
      currentGroups = [...currentGroups, group.id];
    }
    this.finishedStopGroups.set(currentGroups);
    localStorage.setItem(FINISHED_STOP_GROUPS, JSON.stringify(currentGroups));
  }

  async openStopPage(stopGroup: StopGroup) {
    localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(stopGroup));
    await this.router.navigate(['/tour', stopGroup.id]);
  }
}
