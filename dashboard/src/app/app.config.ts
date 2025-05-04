import { ApplicationConfig, InjectionToken, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const BASE_URL = new InjectionToken<string>('BaseUrl');

import {
  createInterceptorCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  IncludeBearerTokenCondition,
  includeBearerTokenInterceptor,
  provideKeycloak,
} from 'keycloak-angular';

const authTokenCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^(http:\/\/localhost:5000)(\/.*)?$/i,
});
const keycloakProvider = provideKeycloak({
  config: {
    url: 'https://auth.htl-leonding.ac.at', // URL of the Keycloak server
    realm: 'htlleonding', // Realm to be used in Keycloak
    clientId: 'htlleonding-service', // Client ID for the application in Keycloak,
  },
  initOptions: {
    onLoad: 'check-sso', // Action to take on load
    //enableLogging: true, // Enables logging
    // IMPORTANT: implicit flow is no longer recommended, but using standard flow leads to a 401 at the keycloak server
    // when retrieving the token with the access code - we leave it like this for the moment until a solution is found
    flow: 'standard', // maybe implicit
  },
  providers: [
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [authTokenCondition], // Specify conditions for adding the Bearer token
    },
  ],
});

export const appConfig: ApplicationConfig = {
  providers: [
    keycloakProvider,
    provideExperimentalZonelessChangeDetection(),
    { provide: BASE_URL, useValue: environment.apiBaseUrl },
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([includeBearerTokenInterceptor])),
  ],
};
