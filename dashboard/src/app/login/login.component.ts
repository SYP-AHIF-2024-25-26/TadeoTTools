import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsService } from '../settings.service';
import Keycloak from "keycloak-js";

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
  private service: SettingsService = inject(SettingsService);

  private readonly keycloak = inject(Keycloak);
  protected isLoggedIn = this.keycloak.authenticated ?? false;

  public ngOnInit(): void {
    if (this.keycloak.token) {
      console.log(this.keycloak.token);
    }
  }

  public async login(): Promise<void> {
    if (this.isLoggedIn) {
      return;
    }
    await this.keycloak.login();

  }

  public async logout(): Promise<void> {
    if (!this.isLoggedIn) {
      return;
    }
    await this.keycloak.logout();
  }
}
