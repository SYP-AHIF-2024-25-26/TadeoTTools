import {
  ApplicationConfig,
  InjectionToken,
  isDevMode,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '@env/environment';

/**
 * URL of the legacy TadeoT backend without `/api`
 * (e.g. `https://tadeot.htl-leonding.ac.at/tadeot-api`).
 */
export const BASE_URL = new InjectionToken<string>('BaseUrl');

declare global {
  interface Window {
    __env?: { backendURL?: string };
  }
}

const baseUrl = (
  environment.production && window.__env?.backendURL
    ? window.__env.backendURL
    : environment.apiBaseUrl
).replace(/\/+$/, '');

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    { provide: BASE_URL, useValue: baseUrl },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
