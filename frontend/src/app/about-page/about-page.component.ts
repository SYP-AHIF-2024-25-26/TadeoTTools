import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeaderComponent } from '../header/header.component';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-about-page',
  imports: [NavbarComponent, HeaderComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
  standalone: true,
})
export class AboutPageComponent {}
