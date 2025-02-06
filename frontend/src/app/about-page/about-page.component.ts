import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
    selector: 'app-about-page',
    imports: [NavbarComponent, HeaderComponent],
    templateUrl: './about-page.component.html',
    styleUrl: './about-page.component.css'
})
export class AboutPageComponent {}
