import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-description-container',
  standalone: true,
  imports: [],
  templateUrl: './description-container.component.html',
  styleUrl: './description-container.component.css'
})
export class DescriptionContainerComponent {
  @Input({required: true}) title!: string;
  @Input({required: true}) description!: string;
  @Input() roomNr: string | undefined;

  protected router = inject(Router);
}
