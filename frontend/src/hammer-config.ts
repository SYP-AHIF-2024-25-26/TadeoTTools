import { Injectable } from '@angular/core';
import { HammerGestureConfig } from '@angular/platform-browser';

@Injectable()
export class MyHammerConfig extends HammerGestureConfig {
  override overrides = {
    swipe: {
      direction: Hammer.DIRECTION_HORIZONTAL,
      velocity: 0.3,
      threshold: 10
    }
  };
}
