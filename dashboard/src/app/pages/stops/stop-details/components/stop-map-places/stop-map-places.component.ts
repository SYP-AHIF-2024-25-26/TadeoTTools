import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  OnInit,
  signal,
} from '@angular/core';
import { MapService } from '@/core/services/map.service';
import { FloorPlanComponent } from '@/shared/components/floor-plan/floor-plan.component';
import { MapPlace } from '@/shared/models/types';

const normalize = (text: string) => text.toLowerCase().replace('/', '-');

// Where the stop shows on the visitor map; saved with the page's Save Changes.
@Component({
  selector: 'app-stop-map-places',
  imports: [FloorPlanComponent],
  templateUrl: './stop-map-places.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopMapPlacesComponent implements OnInit {
  mapPlaceIds = model.required<number[]>();
  roomNr = input.required<string>();

  private mapService = inject(MapService);

  protected places = signal<MapPlace[]>([]);
  protected loadFailed = signal(false);
  protected showPlan = signal(false);
  protected floor = signal('E');

  protected linked = computed(() =>
    this.places().filter((place) => this.mapPlaceIds().includes(place.id))
  );

  /** The room text is what visitors read: it should name what the marker shows. */
  protected textMismatch = computed(() => {
    const room = normalize(this.roomNr());
    const linked = this.linked();
    return (
      linked.length > 0 &&
      !linked.some(
        (place) =>
          room.includes(normalize(place.code).split('+')[0]) ||
          (!!place.name && room.includes(normalize(place.name)))
      )
    );
  });

  async ngOnInit() {
    try {
      this.places.set(await this.mapService.getPlaces());
      const first = this.linked()[0];
      if (first) {
        this.floor.set(first.floor);
      }
    } catch {
      this.loadFailed.set(true);
    }
  }

  protected toggle(place: MapPlace) {
    this.mapPlaceIds.update((ids) =>
      ids.includes(place.id)
        ? ids.filter((id) => id !== place.id)
        : [...ids, place.id]
    );
  }
}
