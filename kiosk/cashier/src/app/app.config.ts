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

/**
 * URL of the TadeoTTools backend without `/v1`, only asked who may use the till
 * (e.g. `https://tadeot.htl-leonding.ac.at/tadeot-tools-backend`).
 */
export const TOOLS_URL = new InjectionToken<string>('ToolsUrl');

declare global {
  interface Window {
    __env?: { backendURL?: string; toolsBackendURL?: string };
  }
}

const baseUrl = (
  environment.production && window.__env?.backendURL
    ? window.__env.backendURL
    : environment.apiBaseUrl
).replace(/\/+$/, '');

const toolsUrl = (
  environment.production && window.__env?.toolsBackendURL
    ? window.__env.toolsBackendURL
    : environment.toolsApiBaseUrl
).replace(/\/+$/, '');

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideHttpClient(withFetch()),
    { provide: BASE_URL, useValue: baseUrl },
    { provide: TOOLS_URL, useValue: toolsUrl },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
