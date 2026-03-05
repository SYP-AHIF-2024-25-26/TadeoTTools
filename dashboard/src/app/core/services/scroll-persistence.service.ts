// src/app/services/scroll-persistence.service.ts
import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ScrollPersistenceService {
  private router = inject(Router);
  private scroller = inject(ViewportScroller);
  
  // Stores the [x, y] coordinates for every URL
  private scrollCache = new Map<string, [number, number]>();

  constructor() {
    // 1. Listen for when the user starts navigating AWAY
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      // 2. Save the scroll position of the CURRENT page before we leave
      this.scrollCache.set(this.router.url, this.scroller.getScrollPosition());
    });
  }

  /**
   * Call this manually in your component once your data is loaded.
   */
  restoreScroll() {
    const currentUrl = this.router.url;
    const savedPosition = this.scrollCache.get(currentUrl);

    if (savedPosition) {
      // We must assume the DOM is ready, or wait a tick
      setTimeout(() => {
        this.scroller.scrollToPosition(savedPosition);
      }, 10); // 10ms buffer for painting
    }
  }
}