import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  standalone: true,
})
export class HeaderComponent {
  @Input() showWelcomeText: boolean = true;
  protected readonly currentHour = new Date().getHours();
}
