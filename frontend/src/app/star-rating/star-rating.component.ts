import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css'],
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Output() ratingChange: EventEmitter<number> = new EventEmitter<number>();

  stars: number[] = [1, 2, 3, 4, 5];
  hoverRating = 0;

  rate(star: number) {
    this.rating = star;
    this.ratingChange.emit(this.rating);
  }
}
