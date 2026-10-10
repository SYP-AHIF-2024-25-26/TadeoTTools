import {
  ApplicationConfig,
  InjectionToken,
  isDevMode,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '@env/environment';

/** Backend URL without `/v1`, like in the GuideApp. */
export const BASE_URL = new InjectionToken<string>('BaseUrl');

declare global {
  interface Window {
    __env?: { backendURL?: string };
  }
}

const baseUrl =
  environment.production && window.__env?.backendURL
    ? window.__env.backendURL
    : environment.apiBaseUrl;

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
