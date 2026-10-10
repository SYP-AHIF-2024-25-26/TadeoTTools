import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { StatisticsService } from './statistics.service';
import { buildSlides, slideId } from '@core/slides';
import { DEFAULT_DELAY_S, MAX_DELAY_S, MIN_DELAY_S } from '@shared/constants';
import { Slide } from '@shared/types';

export interface ShownSlide {
  /** Grows with every change, so the slide is drawn (and animated) anew. */
  key: number;
  slide: Slide;
}

/**
 * Cycles through the slides. Each slide keeps the data it started with; a
 * refresh only shows on the next slide, so no number changes while it is up.
 */
@Injectable({
  providedIn: 'root',
})
export class SlideshowService {
  private statistics = inject(StatisticsService);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private betweenSlides: (() => boolean) | undefined;

  /** Seconds per slide from `?delay=N` (the old `/slideshow/N` redirects there). */
  readonly delayMs = readDelay() * 1000;
  readonly current = signal<ShownSlide | null>(null);
  /** The ids of the slides the current data has, in order, for the markers. */
  readonly ids = computed(() =>
    buildSlides(this.statistics.data()).map(slideId)
  );

  constructor() {
    // The first data (or the first registration) starts the show at once.
    effect(() => {
      if (this.ids().length > 0 && this.current() === null) this.next();
    });
  }

  /**
   * Called between two slides; returning true stops the show there (for a
   * reload with a new app version).
   */
  onBetweenSlides(check: () => boolean): void {
    this.betweenSlides = check;
  }

  private next(): void {
    clearTimeout(this.timer);
    if (this.betweenSlides?.()) return;

    const slides = buildSlides(this.statistics.data());
    const shown = this.current();
    if (slides.length === 0) {
      this.current.set(null);
      return;
    }
    // Continue after the slide that was up, even if the set of slides changed.
    const ids = slides.map(slideId);
    const at = shown ? ids.indexOf(slideId(shown.slide)) : -1;
    const slide =
      at >= 0
        ? slides[(at + 1) % slides.length]
        : (slides.find(
            (s) => !shown || order(slideId(s)) > order(slideId(shown.slide))
          ) ?? slides[0]);

    this.current.set({ key: (shown?.key ?? 0) + 1, slide });
    this.timer = setTimeout(() => this.next(), this.delayMs);
  }
}

const ORDER = [
  'total',
  'time',
  'departments',
  'reasons',
  'schoolTypes',
  'districts',
  'gender',
];

function order(id: string): number {
  return ORDER.indexOf(id);
}

function readDelay(): number {
  const raw = Number(new URLSearchParams(location.search).get('delay'));
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_DELAY_S;
  return Math.min(MAX_DELAY_S, Math.max(MIN_DELAY_S, Math.round(raw)));
}
