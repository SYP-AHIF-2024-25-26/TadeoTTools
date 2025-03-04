import {
  Component,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../login.service';
import Keycloak from 'keycloak-js';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  public readonly response: WritableSignal<string | null> = signal(null);
  public readonly loading: WritableSignal<boolean> = signal(false);

  private service: LoginService = inject(LoginService);
  private readonly router = inject(Router);

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

  async getRole(call: string) {
    this.response.set(await this.service.performCall(call));
  }

  async goToPage() {
    await this.getRole('is-admin');
    if (this.response() && this.response()!.includes('admin')){
      this.router.navigate(['/stopgroups']);
    } else {
      await this.getRole('is-teacher');
      if (this.response() && this.response()!.includes('teacher')){
        this.router.navigate(['/stop/1']); // TODO: go to correlating stop
      } else {
        await this.getRole('at-least-student');
        if (this.response() && this.response()!.includes('student')){
          this.router.navigate(['/student']);
        }
      }
    }
  }
}
