import { Component, inject, Input, signal } from '@angular/core';
import { DescriptionContainerComponent } from '../description-container/description-container.component';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Router } from '@angular/router';
import { Stop, StopGroup } from '../types';
import { NavbarComponent } from '../navbar/navbar.component';
import { CURRENT_STOP_GROUP_PREFIX, CURRENT_STOP_PREFIX } from '../constants';

@Component({
  selector: 'app-stop-description-page',
  standalone: true,
  imports: [DescriptionContainerComponent, HeaderComponent, BreadcrumbComponent, NavbarComponent],
  templateUrl: './stop-description-page.component.html',
  styleUrl: './stop-description-page.component.css',
})
export class StopDescriptionPageComponent {
  private router = inject(Router);

  @Input({ required: true }) stopGroupId!: string;
  @Input({ required: true }) stopId!: string;
  stop = signal({} as Stop);
  currentStopGroup = signal({} as StopGroup);

  async ngOnInit() {
    if (sessionStorage.getItem(CURRENT_STOP_PREFIX) === null || sessionStorage.getItem(CURRENT_STOP_GROUP_PREFIX) === null) {
      await this.router.navigate(['/']);
    } else {
      this.onLoad();
    }
  }

  onLoad() {
    this.stop.set(JSON.parse(sessionStorage.getItem(CURRENT_STOP_PREFIX)!) as Stop);
    this.currentStopGroup.set(JSON.parse(sessionStorage.getItem(CURRENT_STOP_GROUP_PREFIX)!) as StopGroup);
  }
}
