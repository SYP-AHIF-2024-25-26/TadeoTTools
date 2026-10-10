import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { DescriptionContainerComponent } from '@pages/main/description-container/description-container.component';
import { HeaderComponent } from '@shared/components/header/header.component';
import { BreadcrumbComponent } from '@pages/main/breadcrumb/breadcrumb.component';
import { Router } from '@angular/router';
import { Stop, StopGroup } from '@shared/models/types';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import {
  CURRENT_STOP_GROUP_PREFIX,
  CURRENT_STOP_PREFIX,
} from '@shared/constants/constants';

@Component({
  selector: 'app-stop-description-page',
  imports: [
    DescriptionContainerComponent,
    HeaderComponent,
    BreadcrumbComponent,
    NavbarComponent,
  ],
  templateUrl: './stop-description-page.component.html',
  styleUrl: './stop-description-page.component.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopDescriptionPageComponent {
  private router = inject(Router);

  @HostListener('swiperight')
  onSwipeRight() {
    this.goBack();
  }

  stopGroupId = input.required<string>();
  stopId = input.required<string>();
  stop = signal({} as Stop);
  currentStopGroup = signal({} as StopGroup);

  async ngOnInit() {
    if (
      localStorage.getItem(CURRENT_STOP_PREFIX) === null ||
      localStorage.getItem(CURRENT_STOP_GROUP_PREFIX) === null
    ) {
      await this.router.navigate(['/']);
    } else {
      this.onLoad();
    }
  }

  onLoad() {
    this.stop.set(
      JSON.parse(localStorage.getItem(CURRENT_STOP_PREFIX)!) as Stop
    );
    this.currentStopGroup.set(
      JSON.parse(localStorage.getItem(CURRENT_STOP_GROUP_PREFIX)!) as StopGroup
    );
  }

  async goBack() {
    await this.router.navigate(['/tour', this.stopGroupId()]);
  }
}
