import {Component, inject, signal} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import Keycloak from 'keycloak-js';
import {AdminDropdownComponent} from "../admin-dropdown/admin-dropdown.component";
import {LoginService} from "../../login.service";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, AdminDropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private readonly keycloak = inject(Keycloak);
  private readonly service = inject(LoginService);
  protected isAdmin = signal(false);

  async logout() {
    await this.keycloak.logout({ redirectUri: window.location.origin + '/login' });
  }

  async ngOnInit() {
    const response = await this.service.performCall('is-admin');

    this.isAdmin.set(response.includes('admin'));
  }
}
