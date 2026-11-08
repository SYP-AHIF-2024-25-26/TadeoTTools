import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

export type SwipeDirection = 'left' | 'right';

/** Read by the router's view transition (app.config.ts) to slide the page the finger's way. */
export const SWIPE_ATTRIBUTE = 'swipe';

const BOUNCE_PX = 16;
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * One model for every swipe: sideways at the same level (stop ↔ stop, group ↔ group, tab ↔ tab,
 * floor ↔ floor), never up. A swipe replaces the history entry, so the phone's Back leaves the
 * place instead of replaying the swipes. At the first or last item the page springs back.
 */
@Injectable({ providedIn: 'root' })
export class SwipeNavigatorService {
  private router = inject(Router);

  /** The content follows the finger: a swipe to the left brings in what lies to the right. */
  async go(
    commands: unknown[],
    direction: SwipeDirection,
    queryParams?: Record<string, string>
  ) {
    window.scrollTo({ top: 0 });
    document.documentElement.dataset[SWIPE_ATTRIBUTE] = direction;
    await this.router.navigate(commands, { replaceUrl: true, queryParams });
  }

  /** Nothing further this way: the page's content nudges toward the finger and back. */
  bounce(host: HTMLElement, towards: SwipeDirection) {
    if (calm()) {
      return;
    }
    // The content only: moving the page root would carry the fixed tab bar along.
    const target = host.querySelector('main') ?? host;
    const by = BOUNCE_PX * (towards === 'right' ? 1 : -1);
    target.animate(
      [
        { transform: 'translateX(0)' },
        { transform: `translateX(${by}px)`, offset: 0.35 },
        { transform: 'translateX(0)' },
      ],
      { duration: 280, easing: EASE_OUT }
    );
  }
}

export function calm(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
