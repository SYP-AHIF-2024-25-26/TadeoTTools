import { DOCUMENT, inject, Injectable } from '@angular/core';
import { EventManagerPlugin } from '@angular/platform-browser';
import { swipeDebug } from './swipe-debug';

/** A flick, not a scroll that drifts sideways: Hammer's defaults (10 px, 0.3 px/ms) fired on thumb arcs. */
const SWIPE_VELOCITY = 0.4;
const SWIPE_THRESHOLD = 32;
/** The screen edges belong to the phone's own back gesture. */
const EDGE_ZONE = 20;
/** Text fields and wide Markdown blocks keep their own horizontal drags (caret, selection, scrolling). */
const OWN_DRAG =
  'textarea, input, select, [contenteditable="true"], pre, table';

/** Movement before the direction of a touch is decided; small, because iOS takes over within ~80 ms. */
const DECIDE_PX = 3;
/**
 * A touch is kept for the page only if it runs at least twice as far sideways as up or down
 * (under ~27°). A thumb arc that drifts sideways while scrolling stays with the browser.
 */
const SIDEWAYS_RATIO = 2;

interface Entry {
  manager: HammerManager;
  listeners: number;
  release: () => void;
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
        entry.release();
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
    const entry = {
      manager,
      listeners: 0,
      release: keepHorizontalTouches(element),
    };
    this.entries.set(element, entry);
    return entry;
  }
}

/**
 * iOS Safari takes a sideways touch for itself despite the pages' `touch-action: pan-y` and
 * cancels the pointer about 80 ms in, so Hammer never sees the finger lift (checked with
 * ?swipedebug on an iPhone). Cancelling the touchmove of a sideways touch keeps it for the page;
 * vertical scrolling, pinch zoom, text fields and the screen edges stay with the browser.
 */
function keepHorizontalTouches(element: HTMLElement): () => void {
  let start: { x: number; y: number } | null = null;
  let horizontal: boolean | null = null;

  const onStart = (event: TouchEvent) => {
    const touch = event.touches[0];
    const ownDrag = (event.target as Element | null)?.closest(OWN_DRAG);
    const atEdge =
      touch.clientX < EDGE_ZONE ||
      touch.clientX > window.innerWidth - EDGE_ZONE;
    start =
      event.touches.length === 1 && !ownDrag && !atEdge
        ? { x: touch.clientX, y: touch.clientY }
        : null;
    horizontal = null;
  };
  const onMove = (event: TouchEvent) => {
    if (!start || event.touches.length !== 1) {
      start = null;
      return;
    }
    if (horizontal === null) {
      const dx = Math.abs(event.touches[0].clientX - start.x);
      const dy = Math.abs(event.touches[0].clientY - start.y);
      if (Math.max(dx, dy) < DECIDE_PX) {
        return;
      }
      horizontal = dx > SIDEWAYS_RATIO * dy;
      swipeDebug.log(
        horizontal
          ? 'touch sideways: kept for the page'
          : 'touch vertical: browser scrolls'
      );
    }
    if (horizontal && event.cancelable) {
      event.preventDefault();
    }
  };

  element.addEventListener('touchstart', onStart, { passive: true });
  element.addEventListener('touchmove', onMove, { passive: false });
  return () => {
    element.removeEventListener('touchstart', onStart);
    element.removeEventListener('touchmove', onMove);
  };
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
