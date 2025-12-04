import { Component, inject, OnInit } from '@angular/core';
import { LoginService } from '../login.service';
import Keycloak from 'keycloak-js';
import { Router } from '@angular/router';
import { LoaderComponent } from '../standard-components/loader/loader.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LoaderComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  private service: LoginService = inject(LoginService);
  private readonly router = inject(Router);
  private readonly keycloak = inject(Keycloak);

  public async ngOnInit(): Promise<void> {
    try {
      if (this.keycloak.authenticated) {
        // User is already authenticated with Keycloak, check DB and roles
        await this.handleAuthenticatedUser();
      } else {
        // User is not authenticated, start Keycloak login flow
        await this.initiateLogin();
      }
    } catch (error) {
      console.error('Login initialization error:', error);
    }
  }

  // Redirects to Keycloak login page
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

  // Handles logic after successful Keycloak authentication
  private async handleAuthenticatedUser(): Promise<void> {
    const token = this.keycloak.token;
    if (!token) {
      throw new Error('No token received after authentication');
    }

    try {
      // Check if user exists in our database
      const userExists = await this.service.performCall('in-database');

      if (userExists === 'false') {
        console.warn('User not in database');
        await this.logout();
        return;
      }
      await this.determineUserRoleAndNavigate();
    } catch (error) {
      console.error('Error handling authenticated user:', error);
      await this.logout();
    }
  }

  // Checks user roles and navigates to the appropriate dashboard
  private async determineUserRoleAndNavigate(): Promise<void> {
    try {
      // Check for Admin role
      const isAdmin = await this.checkUserRole('is-admin', 'admin');
      if (isAdmin) {
        this.router.navigate(['/students']);
        return;
      }

      // Check for Teacher role
      const isTeacher = await this.checkUserRole('is-teacher', 'teacher');
      if (isTeacher) {
        this.router.navigate(['/teacher']);
        return;
      }

      // Check for Student role
      const isStudent = await this.checkUserRole('at-least-student', 'student');
      if (isStudent) {
        this.router.navigate(['/student']);
        return;
      }

      console.warn('User has no valid role assigned');
    } catch (error) {
      console.error('Error determining user role:', error);
      throw new Error('Failed to determine user permissions');
    }
  }

  // Helper to check a specific role endpoint
  private async checkUserRole(
    roleEndpoint: string,
    expectedRole: string
  ): Promise<boolean> {
    try {
      const roleResponse = await this.service.performCall(roleEndpoint);
      return roleResponse?.toLowerCase().includes(expectedRole) ?? false;
    } catch (error) {
      return false;
    }
  }

  // Logs out from Keycloak
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
}
