import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Shown while there is nothing to chart: before the first data arrives (no
 * word about the cause, the audience cannot fix it) and before the first
 * registration of the day.
 */
@Component({
  selector: 'app-welcome',
  imports: [NgOptimizedImage],
  template: `
    <div class="flex h-full flex-col items-center justify-center text-center">
      <img
        ngSrc="assets/logo.png"
        width="1536"
        height="347"
        priority
        alt="HTL Leonding"
        class="h-[14vmin] w-auto"
      />
      <h1 class="slide-title mt-[6vmin]" [style.font-size.vmin]="8">
        Tag der offenen Tür
      </h1>
      @if (empty()) {
        <p class="slide-note mt-[2.5vmin]" [style.font-size.vmin]="4.4">
          Hier erscheinen gleich die ersten Anmeldungen.
        </p>
      }
    </div>
  `,
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent {
  /** Data is there, but nobody has registered yet. */
  readonly empty = input(false);
}
