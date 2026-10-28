import { DOCUMENT, inject, Injectable } from '@angular/core';
import { EventManagerPlugin } from '@angular/platform-browser';

// Angular 22 removed HammerModule. This plugin keeps the pages' (swipeleft) / (swiperight)
// host bindings working with the same Hammer settings the old HammerGestureConfig had.
@Injectable()
export class HammerSwipePlugin extends EventManagerPlugin {
  constructor() {
    super(inject(DOCUMENT));
  }

  override supports(eventName: string): boolean {
    return eventName === 'swipeleft' || eventName === 'swiperight';
  }

  override addEventListener(
    element: HTMLElement,
    eventName: string,
    handler: (event: HammerInput) => void
  ): () => void {
    // Hammer's computed "pan-y" would block pinch zoom. With this value it sets no inline
    // touch-action, so the pages' own "pan-y pinch-zoom" applies.
    const manager = new Hammer(element, { touchAction: 'pan-y pinch-zoom' });
    manager.get('swipe').set({
      direction: Hammer.DIRECTION_HORIZONTAL,
      velocity: 0.3,
      threshold: 10,
    });
    manager.on(eventName, handler);
    return () => manager.destroy();
  }
}
