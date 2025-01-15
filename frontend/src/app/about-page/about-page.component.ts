import { Component, signal, WritableSignal } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [NavbarComponent, HeaderComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent {}
