import { Component, inject, signal, OnInit, Signal, computed, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../login.service';
import Keycloak from "keycloak-js";

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
  public readonly response: WritableSignal<string | null> = signal(null);
  public readonly loading: WritableSignal<boolean> = signal(false);
  public readonly showResponse: Signal<boolean> = computed(() => this.showResponse() !== null);
  private service: LoginService = inject(LoginService);

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

  getRole(action: string): void {

  }
}
