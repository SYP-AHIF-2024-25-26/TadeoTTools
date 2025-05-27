import { Component, inject, signal, WritableSignal } from '@angular/core';
import { GuideCardComponent } from '../guide-card/guide-card.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeaderComponent } from '../header/header.component';
import { StopGroup } from '../types';
import { ApiFetchService } from '../api-fetch.service';
import { Router } from '@angular/router';
import { CURRENT_STOP_GROUP_PREFIX } from '../constants';

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

  async ngOnInit() {
    await this.onLoad();
  }

  async onLoad() {
    this.groups.set((await this.apiFetchService.getStopGroups()).sort((a, b) => a.rank - b.rank));
    this.showResetButton.set(true);
  }

  async openStopPage(stopGroup: StopGroup) {
    localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(stopGroup));
    await this.router.navigate(['/tour', stopGroup.id]);
  }

  resetGuideApp() {
    localStorage.clear();
    window.location.reload();
  }
}
