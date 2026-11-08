import {
  ApplicationConfig,
  InjectionToken,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  ViewTransitionInfo,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { environment } from '@env/environment';
import { EVENT_MANAGER_PLUGINS } from '@angular/platform-browser';
import { HammerSwipePlugin } from '../hammer-config';
import { calm, SWIPE_ATTRIBUTE } from '@core/services/swipe-navigator.service';

export const BASE_URL = new InjectionToken<string>('BaseUrl');

const baseUrl =
  environment.production && window.__env?.backendURL
    ? window.__env.backendURL
    : environment.apiBaseUrl;

declare global {
  interface Window {
    __env: any;
  }
}

/**
 * Only a swipe slides the page (styles.css, data-swipe-anim); a tap on a tab or a card, a floor
 * change and every navigation under reduced motion switch at once as before.
 */
function onViewTransitionCreated({ transition }: ViewTransitionInfo) {
  const root = document.documentElement;
  const direction = root.dataset[SWIPE_ATTRIBUTE];
  delete root.dataset[SWIPE_ATTRIBUTE];
  if (!direction || calm()) {
    transition.skipTransition();
    return;
  }
  root.dataset['swipeAnim'] = direction;
  transition.finished.finally(() => delete root.dataset['swipeAnim']);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated,
      })
    ),
    {
      provide: BASE_URL,
      useFactory: () => {
        return baseUrl;
      },
    },
    provideHttpClient(withFetch()),
    {
      provide: EVENT_MANAGER_PLUGINS,
      useClass: HammerSwipePlugin,
      multi: true,
    },
  ],
};
