import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { DescriptionContainerComponent } from '../description-container/description-container.component';
import { HeaderComponent } from '../header/header.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Router } from '@angular/router';
import { Stop, StopGroup } from '../types';
import { NavbarComponent } from '../navbar/navbar.component';
import { CURRENT_STOP_GROUP_PREFIX, CURRENT_STOP_PREFIX } from '../constants';
import { StarRatingComponent } from '../star-rating/star-rating.component';
import { RatingService } from '../rating.service';

@Component({
  selector: 'app-stop-description-page',
  imports: [
    DescriptionContainerComponent,
    HeaderComponent,
    BreadcrumbComponent,
    NavbarComponent,
    StarRatingComponent,
  ],
  templateUrl: './stop-description-page.component.html',
  styleUrl: './stop-description-page.component.css',
  standalone: true,
})
export class StopDescriptionPageComponent implements OnInit {
  private router = inject(Router);
  private ratingService = inject(RatingService);

  @Input({ required: true }) stopGroupId!: string;
  @Input({ required: true }) stopId!: string;
  stop = signal({} as Stop);
  currentStopGroup = signal({} as StopGroup);
  rating = signal(0);

  async ngOnInit() {
    if (localStorage.getItem(CURRENT_STOP_PREFIX) === null || localStorage.getItem(CURRENT_STOP_GROUP_PREFIX) === null) {
      await this.router.navigate(['/']);
    } else {
      this.onLoad();
      this.rating.set(this.ratingService.getRating(this.stop().id));
    }
  }

  onLoad() {
    this.stop.set(JSON.parse(localStorage.getItem(CURRENT_STOP_PREFIX)!) as Stop);
    this.currentStopGroup.set(JSON.parse(localStorage.getItem(CURRENT_STOP_GROUP_PREFIX)!) as StopGroup);
  }

  async goBack() {
    await this.router.navigate(['/tour', this.stopGroupId]);
  }

  onRatingChanged(rating: number) {
    // Update UI immediately
    this.rating.set(rating);
    // Save to localStorage and backend
    this.ratingService.setRating(this.stop().id, rating);
  }
}
