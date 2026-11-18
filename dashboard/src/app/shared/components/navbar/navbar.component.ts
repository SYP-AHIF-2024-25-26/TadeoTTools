import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import Keycloak from 'keycloak-js';
import { AdminDropdownComponent } from '@/shared/components/user-menu/user-menu.component';
import { LoginService } from '@/core/services/auth.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterModule, AdminDropdownComponent, NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  private readonly keycloak = inject(Keycloak);
  private readonly service = inject(LoginService);
  protected isAdmin = signal(false);
  // index.html already applied the theme before the first paint.
  isWhiteMode = signal(!document.documentElement.classList.contains('dark'));
  mobileMenuOpen = signal(false);

  private readonly router = inject(Router);

  // The Overview is the admins' home: reached through the logo, not a nav link.
  // `also` lists the editors that belong to a link, so it stays marked there.
  navLinks: { label: string; route: string; also?: string[] }[] = [
    {
      label: 'Students & Stops',
      route: '/students-and-stops',
      also: ['/stop', '/stopgroup'],
    },
    { label: 'Map', route: '/map' },
    { label: 'Feedback', route: '/feedback' },
    { label: 'Registration', route: '/registration' },
    { label: 'Buffet', route: '/buffet' },
    { label: 'Users & Data', route: '/data-management' },
  ];

  // The one link for everyone, also for users without a role.
  protected readonly previewLink = { label: 'Preview', route: '/preview' };

  // Stop managers and students: a link to their own page, next to Preview.
  // Admins have the Overview (logo); users without a role get none.
  protected readonly homeLink = signal<{ label: string; route: string } | null>(
    null
  );

  protected readonly path = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => currentPath(this.router.url))
    ),
    { initialValue: currentPath(this.router.url) }
  );

  isActive(link: { route: string; also?: string[] }): boolean {
    return [link.route, ...(link.also ?? [])].includes(this.path());
  }

  async logout() {
    await this.keycloak.logout({
      redirectUri: window.__env?.keycloakRedirectUri || window.location.origin,
    });
  }

  async ngOnInit() {
    const response = await this.service.checkUserRole('is-admin', 'admin');
    this.isAdmin.set(response);
    if (response) {
      return;
    }
    // Same order as the login page, so the link leads where the login does.
    if (await this.service.checkUserRole('in-database', 'stopmanager')) {
      this.homeLink.set({ label: 'Your Stops', route: '/stop-manager' });
    } else if (
      await this.service.checkUserRole('at-least-student', 'student')
    ) {
      this.homeLink.set({ label: 'Your Stop', route: '/student' });
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

function currentPath(url: string): string {
  return url.split(/[?#]/)[0];
}
