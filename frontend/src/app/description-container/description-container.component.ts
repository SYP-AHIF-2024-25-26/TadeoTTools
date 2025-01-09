import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { BASE_URL } from '../app.config';

@Component({
  selector: 'app-description-container',
  standalone: true,
  imports: [],
  templateUrl: './description-container.component.html',
  styleUrl: './description-container.component.css',
})
export class DescriptionContainerComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;
  @Input() roomNr: string | undefined;
  @Input() divisionIds: number[] | undefined;

  protected baseUrl = inject(BASE_URL);

  protected router = inject(Router);

  hideImage(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }
}
