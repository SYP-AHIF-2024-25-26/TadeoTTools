import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { SlideshowService } from '@core/services/slideshow.service';
import { StatisticsService } from '@core/services/statistics.service';
import { slideId } from '@core/slides';
import { formatStand } from './format';

/**
 * Where the show is (one marker per slide, the current one fills up until
 * the next slide) and how fresh the numbers are. Failures stay invisible: the
 * time simply stops moving. The school logo closes the strip on the right.
 */
@Component({
  selector: 'app-status-strip',
  imports: [NgOptimizedImage],
  template: `
    <div
      class="flex h-[9vmin] items-center gap-[4vmin] bg-gray-100 px-[6vmin] text-gray-600"
    >
      <ol class="flex items-center gap-[1vmin]" aria-hidden="true">
        @for (marker of markers(); track marker.id) {
          <li
            class="relative h-[0.9vmin] w-[5vmin] overflow-hidden rounded-full"
            [class.bg-gray-300]="!marker.done"
            [class.bg-gray-500]="marker.done"
          >
            @if (marker.current) {
              @for (k of [key()]; track k) {
                <span
                  class="marker-fill absolute inset-0 origin-left bg-accent-500"
                  [style.animation-duration.ms]="slideshow.delayMs"
                ></span>
              }
            }
          </li>
        }
      </ol>
      @if (stand(); as stand) {
        <span class="whitespace-nowrap" [style.font-size.vmin]="2.6"
          >Stand {{ stand }}</span
        >
      }
      <img
        ngSrc="assets/logo.png"
        width="1536"
        height="347"
        priority
        alt="HTL Leonding"
        class="ml-auto h-[5vmin] w-auto shrink-0"
      />
    </div>
  `,
  styles: `
    .marker-fill {
      animation: marker-fill linear both;
    }
    @keyframes marker-fill {
      from {
        transform: scaleX(0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .marker-fill {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusStripComponent {
  protected slideshow = inject(SlideshowService);
  private statistics = inject(StatisticsService);

  protected key = computed(() => this.slideshow.current()?.key ?? 0);

  protected markers = computed(() => {
    const shown = this.slideshow.current();
    const currentId = shown ? slideId(shown.slide) : null;
    const ids = this.slideshow.ids();
    const at = currentId ? ids.indexOf(currentId) : -1;
    return ids.map((id, i) => ({
      id,
      current: i === at,
      done: i < at,
    }));
  });

  /** Recomputed with every slide, so a date appears once the data is from another day. */
  protected stand = computed(() => {
    this.key();
    const at = this.statistics.loadedAt();
    return at ? formatStand(at) : null;
  });
}
