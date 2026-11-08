import { DOCUMENT, inject, Injectable } from '@angular/core';
import { EventManagerPlugin } from '@angular/platform-browser';
import { swipeDebug } from './swipe-debug';

/** A flick, not a scroll that drifts sideways: Hammer's defaults (10 px, 0.3 px/ms) fired on thumb arcs. */
const SWIPE_VELOCITY = 0.5;
const SWIPE_THRESHOLD = 32;
/** The screen edges belong to the phone's own back gesture. */
const EDGE_ZONE = 20;
/** Text fields keep their own horizontal drags (moving the caret, selecting). */
const OWN_DRAG = 'textarea, input, select, [contenteditable="true"]';

interface Entry {
  manager: HammerManager;
  listeners: number;
}

// Angular 22 removed HammerModule. This plugin keeps the pages' (swipeleft) / (swiperight)
// host bindings working, with one Hammer manager per element for both directions.
@Injectable()
export class HammerSwipePlugin extends EventManagerPlugin {
  private entries = new WeakMap<HTMLElement, Entry>();

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
    const entry = this.entryFor(element);
    const listener = (event: HammerInput) => {
      const ignored = ignoreReason(event);
      swipeDebug.log(
        ignored ? `${eventName} ignored: ${ignored}` : `${eventName} fired`
      );
      if (!ignored) {
        handler(event);
      }
    };
    entry.manager.on(eventName, listener);
    entry.listeners++;
    return () => {
      entry.manager.off(eventName, listener);
      entry.listeners--;
      if (entry.listeners === 0) {
        entry.manager.destroy();
        this.entries.delete(element);
      }
    };
  }

  private entryFor(element: HTMLElement): Entry {
    const existing = this.entries.get(element);
    if (existing) {
      return existing;
    }
    // Hammer's computed "pan-y" would block pinch zoom. With this value it sets no inline
    // touch-action, so the pages' own "pan-y pinch-zoom" applies.
    const manager = new Hammer(element, { touchAction: 'pan-y pinch-zoom' });
    manager.get('swipe').set({
      direction: Hammer.DIRECTION_HORIZONTAL,
      velocity: SWIPE_VELOCITY,
      threshold: SWIPE_THRESHOLD,
    });
    if (swipeDebug.enabled) {
      manager.on('hammer.input', (input: HammerInput) => {
        if (input.isFinal) {
          swipeDebug.log(
            `end dx=${Math.round(input.deltaX)} dy=${Math.round(input.deltaY)} ` +
              `v=${input.overallVelocityX.toFixed(2)} ${input.eventType === Hammer.INPUT_CANCEL ? 'CANCEL' : 'up'}`
          );
        }
      });
    }
    const entry = { manager, listeners: 0 };
    this.entries.set(element, entry);
    return entry;
  }
}

function ignoreReason(event: HammerInput): string | null {
  if ((event.target as Element | null)?.closest(OWN_DRAG)) {
    return 'text field';
  }
  const startX = event.center.x - event.deltaX;
  if (startX < EDGE_ZONE || startX > window.innerWidth - EDGE_ZONE) {
    return 'screen edge';
  }
  return null;
}
