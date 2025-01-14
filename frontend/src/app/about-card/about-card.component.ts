import { Component, Input } from '@angular/core';
import { TeamMember } from '../types';

@Component({
    selector: 'app-about-card',
    imports: [],
    templateUrl: './about-card.component.html',
    styleUrl: './about-card.component.css'
})
export class AboutCardComponent {
  @Input({ required: true }) member!: TeamMember;
}
