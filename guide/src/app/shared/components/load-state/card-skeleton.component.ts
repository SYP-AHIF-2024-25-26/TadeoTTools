import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Card outlines while a list loads, so the page keeps its shape instead of going blank.
 * Static on purpose: the tour band growing in is the app's one motion moment.
 */
@Component({
  selector: 'app-card-skeleton',
  template: `
    <p class="sr-only" role="status">Wird geladen …</p>
    @for (width of widths(); track $index) {
      <div
        class="flex min-h-20 items-center rounded-2xl bg-white pl-5 pr-4 shadow-md ring-1 ring-gray-900/5"
        aria-hidden="true"
      >
        <div class="h-4 rounded-full bg-gray-200" [style.width.%]="width"></div>
        <div class="ml-auto h-7 w-7 rounded-lg bg-gray-100"></div>
      </div>
    }
  `,
  host: { class: 'flex flex-col gap-3' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardSkeletonComponent {
  count = input(4);

  protected widths = computed(() =>
    Array.from({ length: this.count() }, (_, i) => [62, 48, 70, 40][i % 4])
  );
}
