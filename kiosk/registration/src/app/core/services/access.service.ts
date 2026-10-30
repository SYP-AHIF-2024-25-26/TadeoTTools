import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Keycloak from 'keycloak-js';
import { BASE_URL } from '@app/app.config';
import { classify } from './failure';
import { AccessState, KioskUser } from '@shared/models/types';
import {
  MIN_SESSION_FOR_REGISTRATION_MS,
  SESSION_CHECK_TIMEOUT_MS,
} from '@shared/constants';

/**
 * School login (Keycloak, same client as the dashboard and the cashier) before
 * the first registration. Who may register is decided by the backend: teachers,
 * admins and students accepted at the "Empfang" stop. The token goes with every
 * request (`authInterceptor`); only saving a registration needs it.
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
      console.warn('Keycloak could not be initialised', err);
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
        this.http.get<KioskUser>(`${this.baseUrl}/v1/users/is-registrar`)
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
        console.warn('Registration access could not be checked', err);
        this.state.set(classify(err));
      }
    }
  }

  /**
   * Called by "Anmeldung starten", before anything is entered. A forced refresh
   * also resets Keycloak's idle timeout; the refresh token's `exp` then says when
   * the session ends (the earlier of the idle and the maximum limit; the access
   * token itself only lasts minutes and is renewed silently).
   *
   * 'renew' when the session ended or ends within MIN_SESSION_FOR_REGISTRATION_MS.
   * Without a connection it answers 'ok': saving needs the network anyway and
   * offers "Erneut versuchen".
   */
  async sessionLongEnough(): Promise<'ok' | 'renew'> {
    if (!this.keycloak.refreshToken) return 'renew';
    try {
      await Promise.race([
        this.keycloak.updateToken(-1),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Token refresh timed out')),
            SESSION_CHECK_TIMEOUT_MS
          )
        ),
      ]);
    } catch (err) {
      console.warn('Session could not be refreshed', err);
      // keycloak-js drops the tokens when Keycloak answers 400 (session ended).
      return this.keycloak.refreshToken ? 'ok' : 'renew';
    }
    const exp = this.keycloak.refreshTokenParsed?.exp;
    // Offline tokens carry no end.
    if (!exp) return 'ok';
    const remainingMs =
      (exp - Date.now() / 1000 + (this.keycloak.timeSkew ?? 0)) * 1000;
    return remainingMs < MIN_SESSION_FOR_REGISTRATION_MS ? 'renew' : 'ok';
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

  /** Redirects to the Keycloak login form; the page reloads afterwards. */
  async login(): Promise<void> {
    // Without Wi-Fi the redirect would end on the browser's error page.
    if (!navigator.onLine) {
      this.state.set('no-network');
      return;
    }
    await this.keycloak.login();
  }

  /** Ends the school login, e.g. at a change of shift; the app returns to the login page. */
  logout(): Promise<void> {
    return this.keycloak.logout({
      redirectUri: location.href.split('#')[0],
    });
  }
}
