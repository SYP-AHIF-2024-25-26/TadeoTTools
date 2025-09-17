import { ApplicationConfig, InjectionToken, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const BASE_URL = new InjectionToken<string>('BaseUrl');

const baseUrl = environment.production && window.__env?.backendURL ? window.__env.backendURL : environment.apiBaseUrl;

declare global {
  interface Window {
    __env: any;
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    {
      provide: BASE_URL,
      useFactory: () => {
        return baseUrl;
      }
    },
    provideHttpClient(withFetch()),
  ],
};
