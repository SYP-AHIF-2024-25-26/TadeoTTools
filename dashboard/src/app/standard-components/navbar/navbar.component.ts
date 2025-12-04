import { Component, inject, signal } from '@angular/core';
import { RouterModule, RouterLinkActive } from '@angular/router';
import Keycloak from 'keycloak-js';
import { AdminDropdownComponent } from '../admin-dropdown/admin-dropdown.component';
import { LoginService } from '../../login.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    RouterLinkActive,
    AdminDropdownComponent,
    NgOptimizedImage,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private readonly keycloak = inject(Keycloak);
  private readonly service = inject(LoginService);
  protected isAdmin = signal(false);
  isWhiteMode = signal(true);
  mobileMenuOpen = signal(false);

  navLinks = [
    { label: 'Students', route: '/students' },
    { label: 'StopGroups', route: '/stopgroups' },
    { label: 'Stops', route: '/stops' },
    { label: 'Divisions', route: '/divisions' },
    { label: 'Feedback', route: '/feedback' },
    { label: 'User Management', route: '/user-management' },
  ];

  async logout() {
    // Redirect back to the dashboard base path after logout to stay under /admin/
    await this.keycloak.logout({
      redirectUri: window.location.origin + '/admin/',
    });
  }

  async ngOnInit() {
    const response = await this.service.checkUserRole('is-admin', 'admin');
    this.isAdmin.set(response);
    const colorTheme = localStorage.getItem('color-theme');
    if (colorTheme === 'dark') {
      this.isWhiteMode.set(false);
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'darkCustom');
    }
  }

  changeDarkMode() {
    this.isWhiteMode.set(!this.isWhiteMode());
    if (this.isWhiteMode()) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'darkCustom');
    }
  }
}
