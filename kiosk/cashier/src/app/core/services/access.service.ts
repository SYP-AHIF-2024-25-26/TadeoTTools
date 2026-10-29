import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Keycloak from 'keycloak-js';
import { BASE_URL } from '@app/app.config';
import { classify } from './failure';
import { AccessState, CashierUser } from '@shared/models/types';

/**
 * School login (Keycloak, same client as the dashboard) before the till opens.
 * Who may sell is decided by the backend: teachers, admins and students accepted
 * at the "Buffet" stop. The same login goes with every request (`authInterceptor`),
 * so the backend refuses products and sales without it.
 */
@Injectable({
  providedIn: 'root',
})
export class AccessService {
  private http = inject(HttpClient);
  private baseUrl = inject(BASE_URL);
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
      const user = await firstValueFrom(
        this.http.get<CashierUser>(`${this.baseUrl}/v1/users/is-cashier`)
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

  /**
   * The token for the next request, refreshed when it runs out within 30 s.
   * Undefined while nobody is logged in. If the refresh fails (no Wi-Fi), the
   * old token is sent and the request fails like any other.
   */
  async token(): Promise<string | undefined> {
    if (!this.keycloak.authenticated) return undefined;
    try {
      await this.keycloak.updateToken(30);
    } catch (err) {
      console.warn('Token could not be refreshed', err);
    }
    return this.keycloak.token;
  }

  /**
   * The backend refused a request while selling: the login ran out for good (401,
   * back to the start page) or the access was taken away (403, checked again).
   * Waiting sales stay in the outbox and are sent after the next login.
   */
  lost(status: 401 | 403): void {
    if (this.state() !== 'granted') return;
    if (status === 401) {
      this.keycloak.clearToken();
      this.state.set('logged-out');
    } else {
      this.check();
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
