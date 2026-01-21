import {
  ApplicationConfig,
  InjectionToken,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withDebugTracing, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '@env/environment';

export const BASE_URL = new InjectionToken<string>('BaseUrl');

import {
  AutoRefreshTokenService,
  createInterceptorCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  includeBearerTokenInterceptor,
  provideKeycloak,
  UserActivityService,
  withAutoRefreshToken,
} from 'keycloak-angular';

declare global {
  interface Window {
    __env: { backendURL?: string };
  }
}
const baseUrl =
  environment.production && window.__env?.backendURL
    ? window.__env.backendURL
    : environment.apiBaseUrl;
const escapedBaseUrl = baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
const urlPattern = new RegExp(`^(${escapedBaseUrl})(\\/.*)?$`, 'i');

const authTokenCondition =
  createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: urlPattern,
  });

const keycloakProvider = provideKeycloak({
  config: {
    url: 'https://auth.htl-leonding.ac.at', // URL of the Keycloak server
    realm: 'htlleonding', // Realm to be used in Keycloak
    clientId: 'htlleonding-service', // Client ID for the application in Keycloak,
  },
  initOptions: {
    onLoad: 'login-required', // Action to take on load (check-sso)
    //enableLogging: true, // Enables logging
    // IMPORTANT: implicit flow is no longer recommended, but using standard flow leads to a 401 at the keycloak server
    // when retrieving the token with the access code - we leave it like this for the moment until a solution is found
    flow: 'standard', // maybe implicit
    enableLogging: true,
    checkLoginIframe: false,
    checkLoginIframeInterval: 10,
  },

  providers: [
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [authTokenCondition], // Specify conditions for adding the Bearer token
    },
    AutoRefreshTokenService,
    UserActivityService,
  ],
  features: [
    withAutoRefreshToken({
      sessionTimeout: 1800000, // 30 minutes
      onInactivityTimeout: 'logout',
    }),
  ],
});

export const appConfig: ApplicationConfig = {
  providers: [
    keycloakProvider,
    provideExperimentalZonelessChangeDetection(),
    {
      provide: BASE_URL,
      useFactory: () => {
        return baseUrl;
      },
    },
    provideRouter(
      routes,
      withInMemoryScrolling({
          scrollPositionRestoration: 'disabled', 
          anchorScrolling: 'enabled',
      })
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([includeBearerTokenInterceptor])
    ),
  ],
};
