import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { divisionFill } from '@shared/division-colors';

/** One line of the map's room directory: text on the page, so it never reads as a tour card. */
@Component({
  selector: 'app-stop-row',
  host: { class: 'block' },
  template: `
    <button
      type="button"
      class="flex min-h-12 w-full items-center gap-3 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent-600 active:bg-gray-100"
      (click)="pressed.emit()"
    >
      @if (room() !== null) {
        <span
          class="w-[6.5rem] shrink-0 text-sm font-bold tabular-nums text-gray-900"
          >{{ room() }}</span
        >
      }
      <span
        class="h-3 w-3 shrink-0 rounded-full"
        aria-hidden="true"
        [style.background]="fill()"
      ></span>
      <span class="min-w-0 flex-1 text-base leading-snug text-gray-900">{{
        name()
      }}</span>
      @if (seen()) {
        <svg
          class="h-5 w-5 shrink-0 text-gray-700"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="3"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
        <span class="sr-only">gesehen</span>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopRowComponent {
  /** Empty keeps the column under a room already named; null drops it where the heading names the room. */
  room = input<string | null>(null);
  name = input.required<string>();
  colors = input.required<string[]>();
  seen = input(false);
  pressed = output<void>();

  protected fill = computed(() => divisionFill(this.colors()));
}
