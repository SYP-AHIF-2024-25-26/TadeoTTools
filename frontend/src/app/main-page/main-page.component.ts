import { Component, inject, signal, WritableSignal } from '@angular/core';
import { GuideCardComponent } from '../guide-card/guide-card.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeaderComponent } from '../header/header.component';
import { StopGroup } from '../types';
import { NgClass } from '@angular/common';
import { ApiFetchService } from '../api-fetch.service';
import { Router } from '@angular/router';
import { CURRENT_STOP_GROUP_PREFIX } from '../constants';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [GuideCardComponent, NavbarComponent, HeaderComponent, NgClass],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css',
})
export class MainPageComponent {
  private apiFetchService = inject(ApiFetchService);
  private router = inject(Router);
  groups: WritableSignal<StopGroup[]> = signal([]);

  async ngOnInit() {
    await this.onLoad();
  }

  async onLoad() {
    this.groups.set((await this.apiFetchService.getStopGroups()).sort((a, b) => a.rank - b.rank));
  }

  async openStopPage(stopGroup: StopGroup) {
    localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(stopGroup));
    await this.router.navigate(['/tour', stopGroup.id]);
  }
}
