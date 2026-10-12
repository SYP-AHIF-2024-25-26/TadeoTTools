import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { divisionFill } from '@shared/division-colors';

export interface TourSegment {
  id: number;
  colors: string[];
  seen: boolean;
}

const GROWN_KEY = 'tourBandGrown';

/**
 * A stop group's progress as one bar: one segment per stop in the group's order, in its
 * exact division colour (a gradient through them for several). Seen stops stand 12px tall,
 * the rest are 4px lines on the track. Visitors mostly pick one guide tour, so progress is
 * shown per group, never across the whole day.
 * Decorative for screen readers; a count next to it carries the same information.
 */
@Component({
  selector: 'app-tour-band',
  template: `
    <div
      class="flex h-3 origin-left items-center overflow-hidden rounded-full"
      [class]="tone() === 'night' ? 'bg-night-800' : 'bg-gray-200'"
      [class.animate-grow-x]="grow()"
      [style.gap.px]="gap()"
      aria-hidden="true"
    >
      @for (segment of segments(); track segment.id) {
        <!-- Every segment is 12px; unseen ones are scaled to a 4px line (transform, no layout). -->
        <div
          class="h-3 min-w-0 flex-1 transition-transform duration-300 ease-out"
          [class]="segment.seen ? 'scale-y-100' : 'scale-y-[0.3333]'"
          [style.background]="fill(segment)"
        ></div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourBandComponent implements OnInit {
  segments = input.required<TourSegment[]>();
  /** "night" in the title band, "light" on a white card. */
  tone = input<'night' | 'light'>('night');
  /** Grows in once per visit for this key (the group page's band); none on the cards. */
  growKey = input<string>();

  protected grow = signal(false);
  protected gap = computed(() => (this.segments().length > 30 ? 1 : 2));

  ngOnInit() {
    const key = this.growKey();
    if (key !== undefined) {
      this.grow.set(TourBandComponent.firstShowThisVisit(key));
    }
  }

  protected fill(segment: TourSegment): string {
    return divisionFill(segment.colors);
  }

  private static firstShowThisVisit(key: string): boolean {
    try {
      const grown: unknown = JSON.parse(
        sessionStorage.getItem(GROWN_KEY) ?? '[]'
      );
      const keys = Array.isArray(grown) ? grown : [];
      if (keys.includes(key)) {
        return false;
      }
      sessionStorage.setItem(GROWN_KEY, JSON.stringify([...keys, key]));
    } catch {
      // Storage blocked: just grow every time.
    }
    return true;
  }
}
