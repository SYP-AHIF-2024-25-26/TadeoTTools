import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
import { AdminDropdownComponent } from '../admin-dropdown/admin-dropdown.component';
import { LoginService } from '../../login.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, AdminDropdownComponent],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private readonly keycloak = inject(Keycloak);
  private readonly service = inject(LoginService);
  protected isAdmin = signal(false);
  isDarkMode = signal(false);
  mobileMenuOpen = signal(false);

  async logout() {
    await this.keycloak.logout({ redirectUri: window.location.origin + '/login' });
  }

  async ngOnInit() {
    const response = await this.service.performCall('is-admin');
    this.isAdmin.set(response.includes('admin'));
  }

  changeDarkMode() {
    const html = document.documentElement;
    if (localStorage.getItem('color-theme')) {
      if (localStorage.getItem('color-theme') === 'light') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
        html.setAttribute('data-theme', 'darkCustom');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
        html.removeAttribute('data-theme'); 
      }
    } else {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('color-theme', 'light');
        html.removeAttribute('data-theme'); 
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('color-theme', 'dark');
        html.setAttribute('data-theme', 'darkCustom');
      }
    }
  }
}
