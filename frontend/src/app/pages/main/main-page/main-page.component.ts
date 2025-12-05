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
import { CURRENT_STOP_GROUP_PREFIX } from '@shared/constants/constants';

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

  @HostListener('swipeleft')
  onSwipeRight() {
    this.router.navigate(['/map']);
  }

  async ngOnInit() {
    await this.onLoad();
  }

  async onLoad() {
    this.groups.set(
      (await this.apiFetchService.getStopGroups()).sort(
        (a, b) => a.rank - b.rank
      )
    );
    this.showResetButton.set(true);
  }

  async openStopPage(stopGroup: StopGroup) {
    localStorage.setItem(CURRENT_STOP_GROUP_PREFIX, JSON.stringify(stopGroup));
    await this.router.navigate(['/tour', stopGroup.id]);
  }
}
