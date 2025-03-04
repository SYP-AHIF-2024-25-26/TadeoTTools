import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private readonly keycloak = inject(Keycloak);
  private readonly router = inject(Router);

  async logout() {
    await this.keycloak.logout({ redirectUri: window.location.origin + '/login' });
  }
}
