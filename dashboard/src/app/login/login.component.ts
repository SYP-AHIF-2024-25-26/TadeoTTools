import {Component, inject, signal, WritableSignal,} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {LoginService} from '../login.service';
import Keycloak from 'keycloak-js';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  public readonly response: WritableSignal<string | null> = signal(null);
  public readonly loading: WritableSignal<boolean> = signal(false);

  private service: LoginService = inject(LoginService);
  private readonly router = inject(Router);

  private readonly keycloak = inject(Keycloak);
  protected isLoggedIn = this.keycloak.authenticated ?? false;

  public async login(): Promise<void> {
    if (this.isLoggedIn) {
      return;
    }
    await this.keycloak.login();
    await this.service.performCall('in-database')
      .then((response) => {
        if (response === 'false') {
          this.response.set('User not in database, please contact admin');
          this.keycloak.logout();
          return;
        }
      })
      .catch((error) => {
        console.error('Error during login:', error);
        this.keycloak.logout();
      });
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
        this.router.navigate(['/teacher']); // TODO: go to correlating stop
      } else {
        await this.getRole('at-least-student');
        if (this.response() && this.response()!.includes('student')){
          this.router.navigate(['/student']);
        }
      }
    }
  }
}
