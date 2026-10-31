import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { divisionFill } from '@shared/division-colors';

/** A room on the plan: one disc in the exact division colours, whatever its number of stops. */
@Component({
  selector: 'app-map-marker',
  template: `
    <button
      type="button"
      class="flex h-11 w-11 items-center justify-center rounded-full"
      [attr.aria-label]="label()"
      (click)="pressed.emit()"
    >
      <span
        class="disc flex h-6 w-6 items-center justify-center rounded-full text-sm font-extrabold tabular-nums text-white"
        [class.highlighted]="highlighted()"
        [style.background]="fill()"
      >
        @if (seen()) {
          <svg
            class="h-4 w-4"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="3.5"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        } @else if (count() > 1) {
          {{ count() }}
        } @else {
          <span class="h-2 w-2 rounded-full bg-white"></span>
        }
      </span>
    </button>
  `,
  styleUrl: './map-marker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapMarkerComponent {
  colors = input.required<string[]>();
  count = input.required<number>();
  /** Seen stops keep their exact colour: a check marks them, nothing fades. */
  seen = input(false);
  highlighted = input(false);
  label = input.required<string>();
  pressed = output<void>();

  protected fill = computed(() => divisionFill(this.colors()));
}
