import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
} from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { StatisticsService } from '@core/services/statistics.service';
import { ShownSlide, SlideshowService } from '@core/services/slideshow.service';
import { WakeLockService } from '@core/services/wake-lock.service';
import { StatusStripComponent } from '@shared/status-strip.component';
import { BarsSlideComponent } from '@app/slides/bars-slide.component';
import { GenderSlideComponent } from '@app/slides/gender-slide.component';
import { TimeSlideComponent } from '@app/slides/time-slide.component';
import { TotalSlideComponent } from '@app/slides/total-slide.component';
import { WelcomeComponent } from '@app/slides/welcome.component';

/** How long the outgoing slide takes to fade before it is removed. */
const FADE_MS = 900;

/**
 * An unattended slideshow for the projector: no routes, no buttons, no
 * dialogs. Everything it needs comes from the URL (`?delay=N`) and the
 * legacy backend.
 */
@Component({
  selector: 'app-root',
  imports: [
    StatusStripComponent,
    BarsSlideComponent,
    GenderSlideComponent,
    TimeSlideComponent,
    TotalSlideComponent,
    WelcomeComponent,
  ],
  template: `
    @if (slideshow.current()) {
      <app-status-strip />
    }
    <main class="relative min-h-0 flex-1">
      @for (layer of layers(); track layer.key) {
        <section
          class="absolute inset-0 px-[6vmin] pb-[5vmin] pt-[5vmin]"
          [class.slide-leave]="layer.key !== slideshow.current()?.key"
          [class.slide-enter]="layer.key === slideshow.current()?.key"
          [attr.aria-hidden]="layer.key !== slideshow.current()?.key"
        >
          @let slide = layer.slide;
          @if (slide.kind === 'total') {
            <app-total-slide [slide]="slide" />
          } @else if (slide.kind === 'time') {
            <app-time-slide [slide]="slide" />
          } @else if (slide.kind === 'bars') {
            <app-bars-slide [slide]="slide" />
          } @else {
            <app-gender-slide [slide]="slide" />
          }
        </section>
      }
      @if (!slideshow.current()) {
        <app-welcome
          class="absolute inset-0 p-[6vmin]"
          [empty]="statistics.data() !== null"
        />
      }
    </main>
  `,
  styles: `
    .slide-enter {
      animation: slide-in 550ms ease-out 150ms both;
    }
    .slide-leave {
      opacity: 0;
      transition: opacity 350ms ease-in;
    }
    @keyframes slide-in {
      from {
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .slide-enter {
        animation: none;
      }
      .slide-leave {
        transition: none;
      }
    }
  `,
  host: { class: 'flex h-dvh flex-col overflow-hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected statistics = inject(StatisticsService);
  protected slideshow = inject(SlideshowService);
  private swUpdate = inject(SwUpdate);
  private updateReady = false;

  /** The current slide plus, for a moment, the one fading out. */
  protected layers = signal<ShownSlide[]>([]);

  constructor() {
    inject(WakeLockService).keepAwake();
    this.statistics.load();

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') this.updateReady = true;
      });
    }
    // A new version is applied between two slides, never in the middle of one.
    this.slideshow.onBetweenSlides(() => {
      if (!this.updateReady) return false;
      document.location.reload();
      return true;
    });

    effect(() => {
      const shown = this.slideshow.current();
      if (!shown) {
        this.layers.set([]);
        return;
      }
      this.layers.update((layers) => [
        ...layers.filter((l) => l.key === shown.key - 1),
        shown,
      ]);
      setTimeout(
        () =>
          this.layers.update((layers) =>
            layers.filter((l) => l.key >= shown.key)
          ),
        FADE_MS
      );
    });
  }
}
