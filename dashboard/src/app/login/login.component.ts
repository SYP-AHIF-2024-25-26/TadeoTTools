import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../login.service';
import Keycloak from 'keycloak-js';
import { Router } from '@angular/router';
import { LoaderComponent } from '../standard-components/loader/loader.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, LoaderComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  public readonly response: WritableSignal<string | null> = signal(null);
  public readonly loading: WritableSignal<boolean> = signal(false);

  private service: LoginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly keycloak = inject(Keycloak);

  protected isLoggedIn = this.keycloak.authenticated ?? false;

  public async ngOnInit(): Promise<void> {
    this.loading.set(true);

    try {
      if (this.keycloak.authenticated) {
        await this.handleAuthenticatedUser();
      } else {
        await this.initiateLogin();
      }
    } catch (error) {
      console.error('Login initialization error:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async initiateLogin(): Promise<void> {
    try {
      await this.keycloak.login({
        redirectUri: window.location.origin + window.location.pathname,
      });
    } catch (error) {
      console.error('Keycloak login error:', error);
      throw new Error('Failed to initiate login');
    }
  }

  private async handleAuthenticatedUser(): Promise<void> {
    const token = this.keycloak.token;
    if (!token) {
      throw new Error('No token received after authentication');
    }

    try {
      const userExists = await this.service.performCall('in-database');

      if (userExists === 'false') {
        this.response.set('User not in database, please contact admin');
        await this.logout();
        return;
      }
      await this.determineUserRoleAndNavigate();
    } catch (error) {
      console.error('Error handling authenticated user:', error);
      await this.logout();
    }
  }

  private async determineUserRoleAndNavigate(): Promise<void> {
    try {
      const isAdmin = await this.checkUserRole('is-admin');
      if (isAdmin) {
        this.router.navigate(['/students']);
        return;
      }

      const isTeacher = await this.checkUserRole('is-teacher');
      if (isTeacher) {
        this.router.navigate(['/teacher']);
        return;
      }

      const isStudent = await this.checkUserRole('at-least-student');
      if (isStudent) {
        this.router.navigate(['/student']);
        return;
      }

      console.warn('User has no valid role assigned');
      this.response.set('No valid role assigned. Please contact admin.');
    } catch (error) {
      console.error('Error determining user role:', error);
      throw new Error('Failed to determine user permissions');
    }
  }

  private async checkUserRole(roleEndpoint: string): Promise<boolean> {
    try {
      const roleResponse = await this.service.performCall(roleEndpoint);
      this.response.set(roleResponse);

      const roleMap: Record<string, string> = {
        'is-admin': 'admin',
        'is-teacher': 'teacher',
        'at-least-student': 'student',
      };

      const expectedRole = roleMap[roleEndpoint];
      return roleResponse?.toLowerCase().includes(expectedRole) ?? false;
    } catch (error) {
      return false;
    }
  }

  private async logout(): Promise<void> {
    try {
      await this.keycloak.logout({
        redirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Logout error:', error);
      window.location.reload();
    }
  }

  public async retry(): Promise<void> {
    await this.ngOnInit();
  }
}
