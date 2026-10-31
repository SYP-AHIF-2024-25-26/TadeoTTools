import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Params, RouterLink } from '@angular/router';

/** The night frame: sticky top bar with the school logo, then the title band. */
@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  title = input.required<string>();
  /** 'start' sets the larger title of the start page. */
  size = input<'start' | 'page'>('page');
  backLabel = input<string>();
  backLink = input<string | unknown[]>('/main');
  backQueryParams = input<Params | null>(null);
}
