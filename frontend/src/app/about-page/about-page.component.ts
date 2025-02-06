import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
<<<<<<< Updated upstream
  selector: 'app-about-page',
  standalone: true,
  imports: [NavbarComponent, HeaderComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
=======
    selector: 'app-about-page',
    imports: [NavbarComponent, HeaderComponent],
    templateUrl: './about-page.component.html',
    styleUrl: './about-page.component.css'
>>>>>>> Stashed changes
})
export class AboutPageComponent {}
