import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Keycloak from 'keycloak-js';
import { TOOLS_URL } from '@app/app.config';
import { classify } from './failure';
import { AccessState, CashierUser } from '@shared/models/types';

/**
 * School login (Keycloak, same client as the dashboard) before the till opens.
 * Who may sell is decided by the TadeoTTools backend: teachers, admins and students
 * accepted at the "Buffet" stop. The legacy backend itself still needs no login,
 * so this only guards the screen.
 */
@Injectable({
  providedIn: 'root',
})
export class AccessService {
  private http = inject(HttpClient);
  private toolsUrl = inject(TOOLS_URL);
  private keycloak = new Keycloak({
    url: 'https://auth.htl-leonding.ac.at',
    realm: 'htlleonding',
    clientId: 'htlleonding-service',
  });
  /** keycloak-js may only be initialised once per page load. */
  private initialised: Promise<boolean> | undefined;
  private initFailed = false;

  readonly state = signal<AccessState>('checking');
  /** Name of the logged-in person, with the class for students. */
  readonly userName = signal('');

  async check(): Promise<void> {
    // A failed keycloak-js cannot be initialised again; a reload starts over.
    if (this.initFailed) {
      location.reload();
      return;
    }
    this.state.set('checking');
    // Without Wi-Fi the redirect to the login page would end on the browser's error page.
    if (!navigator.onLine) {
      this.state.set('no-network');
      return;
    }
    let authenticated: boolean;
    try {
      // check-sso picks up a running login (after the login redirect or a reload)
      // without ever showing the Keycloak form; nobody logged in ends on the start page.
      this.initialised ??= this.keycloak.init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
      });
      authenticated = await this.initialised;
    } catch (err) {
      console.warn('Keycloak login failed', err);
      this.initFailed = true;
      this.state.set(navigator.onLine ? 'server' : 'no-network');
      return;
    }
    if (!authenticated) {
      this.state.set('logged-out');
      return;
    }

    // Only shown when access is denied; the backend answers with the name otherwise.
    const token = this.keycloak.tokenParsed;
    this.userName.set(token?.['name'] ?? token?.['preferred_username'] ?? '');

    try {
      await this.keycloak.updateToken(30);
      const user = await firstValueFrom(
        this.http.get<CashierUser>(`${this.toolsUrl}/v1/users/is-cashier`, {
          headers: { Authorization: `Bearer ${this.keycloak.token}` },
        })
      );
      this.userName.set(
        user.studentClass ? `${user.name} (${user.studentClass})` : user.name
      );
      this.state.set('granted');
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 403) {
        this.state.set('denied');
      } else if (err instanceof HttpErrorResponse && err.status === 401) {
        this.keycloak.clearToken();
        this.state.set('logged-out');
      } else {
        console.warn('Cashier access could not be checked', err);
        this.state.set(classify(err));
      }
    }
  }

  /** Only on the button of the start page: redirects to the Keycloak login form. */
  async login(): Promise<void> {
    // Without Wi-Fi the redirect would end on the browser's error page.
    if (!navigator.onLine) {
      this.state.set('no-network');
      return;
    }
    await this.keycloak.login();
  }

  /** Ends the school login, e.g. at a change of shift; the app returns to the start page. */
  logout(): Promise<void> {
    return this.keycloak.logout({
      redirectUri: location.href.split('#')[0],
    });
  }
}
