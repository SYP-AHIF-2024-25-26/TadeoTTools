import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { mapRoomOf } from '@shared/room';

/**
 * "Raum 101 · Auf der Karte" in the title band: the room and its way to the floor plan
 * sit together, so the content below stays for reading.
 */
@Component({
  selector: 'app-room-line',
  imports: [RouterLink],
  template: `
    <span class="text-base font-semibold tabular-nums text-night-100"
      >Raum {{ roomNr() }}</span
    >
    @if (mapRoom()) {
      <a
        [routerLink]="['/map', mapRoom()]"
        [queryParams]="stopId() ? { stop: stopId() } : {}"
        class="-mx-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-1 text-base font-bold text-accent-400 transition-colors hover:text-accent-300"
      >
        <svg
          class="h-5 w-5 shrink-0"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
          />
        </svg>
        Auf der Karte
      </a>
    }
  `,
  host: { class: 'inline-flex flex-wrap items-center gap-x-3' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomLineComponent {
  roomNr = input.required<string>();
  /** Rings all rooms of this stop on the map. */
  stopId = input<number>();

  protected mapRoom = computed(() => mapRoomOf(this.roomNr()));
}
