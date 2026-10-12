import { Injectable } from '@angular/core';
import { HammerGestureConfig } from '@angular/platform-browser';

@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  // Hammer's computed "pan-y" would block pinch zoom. With this value it sets no inline
  // touch-action, so the pages' own "pan-y pinch-zoom" applies.
  override options = { touchAction: 'pan-y pinch-zoom' };

  override overrides = {
    swipe: {
      direction: Hammer.DIRECTION_HORIZONTAL,
      velocity: 0.3,
      threshold: 10,
    },
  };
}
