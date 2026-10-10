import { Injectable } from '@angular/core';

/**
 * Keeps the screen on while the app is open, so the projector PC does not
 * dim or lock. The browser releases the lock whenever the page is hidden, so
 * it is requested again on return.
 */
@Injectable({
  providedIn: 'root',
})
export class WakeLockService {
  private lock: WakeLockSentinel | null = null;

  keepAwake(): void {
    if (!('wakeLock' in navigator)) return;
    this.request();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.request();
    });
  }

  private async request(): Promise<void> {
    if (this.lock && !this.lock.released) return;
    try {
      this.lock = await navigator.wakeLock.request('screen');
    } catch (err) {
      // Refused e.g. without a secure context; not critical.
      console.warn('Screen wake lock not available', err);
    }
  }
}
