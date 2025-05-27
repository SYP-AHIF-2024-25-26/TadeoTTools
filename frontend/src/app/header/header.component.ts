import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  standalone: true,
})
export class HeaderComponent {
  @Input() showWelcomeText: boolean = true;
  protected router = inject(Router);
  protected readonly currentHour = new Date().getHours();
}
