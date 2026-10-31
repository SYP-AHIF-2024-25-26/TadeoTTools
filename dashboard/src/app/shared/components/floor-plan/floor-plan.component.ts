import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { MapPlace } from '@/shared/models/types';

export const FLOORS = [
  { code: '1', name: 'Floor 1', image: 'assets/plans/plan-1.png' },
  { code: 'E', name: 'Ground Floor', image: 'assets/plans/plan-E.png' },
  { code: 'U', name: 'Basement', image: 'assets/plans/plan-U.png' },
];

const ZOOMS = [100, 150, 200, 300];

export type PlanPoint = { x: number; y: number };

// One floor plan with a button per place. The positions are fractions of the plan.
@Component({
  selector: 'app-floor-plan',
  templateUrl: './floor-plan.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class FloorPlanComponent {
  places = input.required<MapPlace[]>();
  selectedIds = input<number[]>([]);
  /** Places can be dragged to a new position. */
  movable = input(false);
  floor = model('E');

  placeClick = output<MapPlace>();
  planClick = output<PlanPoint>();
  placeMoved = output<{ place: MapPlace } & PlanPoint>();

  protected floors = FLOORS;
  protected zoom = signal(ZOOMS[0]);
  protected canZoomIn = computed(() => this.zoom() < ZOOMS[ZOOMS.length - 1]);
  protected canZoomOut = computed(() => this.zoom() > ZOOMS[0]);
  protected image = computed(
    () => FLOORS.find((floor) => floor.code === this.floor())!.image
  );
  protected floorPlaces = computed(() =>
    this.places().filter((place) => place.floor === this.floor())
  );

  /** The place being dragged and where it is now. */
  protected drag = signal<({ id: number } & PlanPoint) | null>(null);
  private moved = false;

  protected zoomBy(step: number) {
    this.zoom.update((zoom) => ZOOMS[ZOOMS.indexOf(zoom) + step] ?? zoom);
  }

  protected isSelected(place: MapPlace): boolean {
    return this.selectedIds().includes(place.id);
  }

  protected left(place: MapPlace): number {
    const drag = this.drag();
    return (drag?.id === place.id ? drag.x : place.x) * 100;
  }

  protected top(place: MapPlace): number {
    const drag = this.drag();
    return (drag?.id === place.id ? drag.y : place.y) * 100;
  }

  protected title(place: MapPlace): string {
    const stops = place.stopIds.length;
    const count = stops === 0 ? '' : ` (${stops})`;
    return `${place.code}${place.name ? ` · ${place.name}` : ''}${count}`;
  }

  protected onPlanClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.planClick.emit(
        this.point(event, event.currentTarget as HTMLElement)
      );
    }
  }

  protected onPlaceClick(place: MapPlace) {
    if (this.moved) {
      this.moved = false;
    } else {
      this.placeClick.emit(place);
    }
  }

  protected onDragStart(event: PointerEvent, place: MapPlace) {
    if (this.movable()) {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
      this.drag.set({ id: place.id, x: place.x, y: place.y });
      this.moved = false;
    }
  }

  protected onDragMove(event: PointerEvent, plan: HTMLElement) {
    const drag = this.drag();
    if (drag) {
      this.drag.set({ id: drag.id, ...this.point(event, plan) });
      this.moved = true;
    }
  }

  protected onDragEnd(place: MapPlace) {
    const drag = this.drag();
    this.drag.set(null);
    if (drag && this.moved) {
      this.placeMoved.emit({ place, x: drag.x, y: drag.y });
    }
  }

  private point(event: MouseEvent, plan: HTMLElement): PlanPoint {
    const rect = plan.getBoundingClientRect();
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    return {
      x: clamp((event.clientX - rect.left) / rect.width),
      y: clamp((event.clientY - rect.top) / rect.height),
    };
  }
}
