import { Component, signal, WritableSignal } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeaderComponent } from '../header/header.component';
import { TeamMember } from '../types';
import { AboutCardComponent } from '../about-card/about-card.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    NavbarComponent,
    HeaderComponent,
    AboutCardComponent,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css'
})
export class AboutPageComponent {
  members: TeamMember[] = [
    {
      name: 'Luca Haas',
      class: '4AHIF',
      schoolYear: '4. Klasse Informatik',
    },
    {
      name: 'Melanie Dohr',
      class: '4AHIF',
      schoolYear: '4. Klasse Informatik',
    },
    {
      name: 'Andreas Huber',
      class: '4AHIF',
      schoolYear: '4. Klasse Informatik',
    }
    ];

  selectedTab: WritableSignal<string> = signal('about');

  selectTab(tab: string): void {
    this.selectedTab.set(tab);
  }
}
