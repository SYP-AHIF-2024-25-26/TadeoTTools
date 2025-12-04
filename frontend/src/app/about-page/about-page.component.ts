import { Component, HostListener } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { HeaderComponent } from '../header/header.component';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-about-page',
  imports: [NavbarComponent, HeaderComponent],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
  standalone: true,
})
export class AboutPageComponent {
  private router = inject(Router);

  resetGuideApp() {
    localStorage.clear();
    window.location.reload();
  }

  @HostListener('swiperight')
  onSwipeRight() {
    this.router.navigate(['/feedback']);
  }
}
