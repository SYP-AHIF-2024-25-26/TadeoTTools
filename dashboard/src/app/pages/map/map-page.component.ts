import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { MapService, SaveMapPlace } from '@/core/services/map.service';
import { StopService } from '@/core/services/stop.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import {
  FloorPlanComponent,
  PlanPoint,
} from '@/shared/components/floor-plan/floor-plan.component';
import { LoaderComponent } from '@/shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '@/shared/components/page-header/page-header.component';
import { MapPlace, Stop } from '@/shared/models/types';
import { plural } from '@/shared/utils/utils';

// Links the stops to the rooms on the plans and keeps the rooms and spots themselves.
@Component({
  selector: 'app-map-page',
  imports: [
    FloorPlanComponent,
    LoaderComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './map-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPageComponent implements OnInit {
  private mapService = inject(MapService);
  private stopService = inject(StopService);
  private confirm = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  protected loading = signal(true);
  protected loadFailed = signal(false);
  protected places = signal<MapPlace[]>([]);
  protected stops = signal<Stop[]>([]);
  protected floor = signal('E');
  protected showAllStops = signal(false);

  /** The stop whose rooms a click on the plan toggles. */
  protected linkingStop = signal<Stop | null>(null);
  /** The place in the form; id 0 is a new one. */
  protected editing = signal<(PlanPoint & { id: number }) | null>(null);
  /** The next click on the plan sets a new place. */
  protected adding = signal(false);
  protected saving = signal(false);
  protected icons = ['buffet', 'wc', 'info'];

  protected form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    name: new FormControl('', { nonNullable: true }),
    publicLabel: new FormControl('', { nonNullable: true }),
    icon: new FormControl('buffet', { nonNullable: true }),
  });

  private stopPlaces = computed(() => {
    const links = new Map<number, MapPlace[]>();
    for (const place of this.places()) {
      for (const stopId of place.stopIds) {
        links.set(stopId, [...(links.get(stopId) ?? []), place]);
      }
    }
    return links;
  });
  protected unlinkedCount = computed(
    () => this.stops().filter((stop) => !this.isLinked(stop)).length
  );
  protected listedStops = computed(() =>
    this.stops().filter((stop) => this.showAllStops() || !this.isLinked(stop))
  );
  protected linkedPlaces = computed(() => {
    const stop = this.linkingStop();
    return stop ? (this.stopPlaces().get(stop.id) ?? []) : [];
  });
  protected selectedIds = computed(() => {
    const editing = this.editing();
    return editing
      ? [editing.id]
      : this.linkedPlaces().map((place) => place.id);
  });
  protected editingStops = computed(() => {
    const place = this.places().find((p) => p.id === this.editing()?.id);
    return this.stops().filter((stop) => place?.stopIds.includes(stop.id));
  });

  async ngOnInit() {
    try {
      const [places, stops] = await Promise.all([
        this.mapService.getPlaces(),
        this.stopService.getStops(),
      ]);
      this.places.set(places);
      this.stops.set(stops);
    } catch {
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private isLinked(stop: Stop): boolean {
    return this.stopPlaces().has(stop.id);
  }

  protected placesOf(stop: Stop): string {
    return (this.stopPlaces().get(stop.id) ?? [])
      .map((place) => place.code)
      .join(', ');
  }

  private async reloadPlaces() {
    this.places.set(await this.mapService.getPlaces());
  }

  protected startLinking(stop: Stop) {
    this.editing.set(null);
    this.adding.set(false);
    this.linkingStop.set(stop);
    const first = this.stopPlaces().get(stop.id)?.[0];
    if (first) {
      this.floor.set(first.floor);
    }
  }

  protected async onPlaceClick(place: MapPlace) {
    const stop = this.linkingStop();
    if (!stop) {
      this.openForm(place);
      return;
    }
    const ids = this.linkedPlaces().map((linked) => linked.id);
    await this.setLinks(
      stop,
      ids.includes(place.id)
        ? ids.filter((id) => id !== place.id)
        : [...ids, place.id]
    );
  }

  private async setLinks(stop: Stop, placeIds: number[]) {
    try {
      await this.mapService.setPlacesOfStop(stop.id, placeIds);
      await this.reloadPlaces();
    } catch (error) {
      this.toast.error(errorText(error, 'The link could not be saved.'));
    }
  }

  protected removeLink(place: MapPlace) {
    const stop = this.linkingStop();
    if (stop) {
      this.setLinks(
        stop,
        this.linkedPlaces()
          .map((linked) => linked.id)
          .filter((id) => id !== place.id)
      );
    }
  }

  protected async applySuggestions() {
    try {
      const suggestions = await this.mapService.getSuggestions();
      if (suggestions.length === 0) {
        this.toast.success(
          'No stops left that can be linked from their room text.'
        );
        return;
      }
      const list = suggestions
        .map((s) => `${s.stopName} → ${s.placeCodes.join(', ')}`)
        .join('; ');
      const confirmed = await this.confirm.confirm({
        title: 'Link Stops from Room Text',
        message: `Links ${plural(suggestions.length, 'stop')} without a place, as their room text says: ${list}. Stops already linked stay as they are.`,
        confirmLabel: 'Link Stops',
        tone: 'primary',
      });
      if (!confirmed) {
        return;
      }
      const linked = await this.mapService.applySuggestions();
      await this.reloadPlaces();
      this.toast.success(`${plural(linked, 'stop')} linked.`);
    } catch (error) {
      this.toast.error(errorText(error, 'The stops could not be linked.'));
    }
  }

  private openForm(place: MapPlace) {
    this.adding.set(false);
    this.floor.set(place.floor);
    this.editing.set({ id: place.id, x: place.x, y: place.y });
    this.form.reset({
      code: place.code,
      name: place.name ?? '',
      publicLabel: place.publicLabel ?? '',
      icon: place.icon ?? 'buffet',
    });
  }

  protected startAdding() {
    this.linkingStop.set(null);
    this.editing.set(null);
    this.adding.set(true);
  }

  protected onPlanClick(point: PlanPoint) {
    if (this.adding()) {
      this.adding.set(false);
      this.editing.set({ id: 0, ...point });
      this.form.reset({ code: '', name: '', publicLabel: '', icon: 'buffet' });
    }
  }

  protected closePanel() {
    this.editing.set(null);
    this.adding.set(false);
    this.linkingStop.set(null);
  }

  private payload(place: PlanPoint, floor: string): SaveMapPlace {
    const value = this.form.getRawValue();
    return {
      floor,
      code: value.code.trim(),
      name: value.name.trim() || null,
      x: place.x,
      y: place.y,
      publicLabel: value.publicLabel.trim() || null,
      icon: value.icon,
    };
  }

  protected async savePlace() {
    const editing = this.editing();
    if (!editing || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    try {
      const place = this.payload(editing, this.floor());
      if (editing.id === 0) {
        await this.mapService.addPlace(place);
      } else {
        await this.mapService.updatePlace(editing.id, place);
      }
      await this.reloadPlaces();
      this.editing.set(null);
      this.toast.success('Place saved.');
    } catch (error) {
      this.toast.error(errorText(error, 'The place could not be saved.'));
    } finally {
      this.saving.set(false);
    }
  }

  /** A dropped marker is saved right away; a marker is not worth a form. */
  protected async onPlaceMoved(moved: { place: MapPlace } & PlanPoint) {
    const { place, x, y } = moved;
    try {
      await this.mapService.updatePlace(place.id, { ...place, x, y });
      await this.reloadPlaces();
      if (this.editing()?.id === place.id) {
        this.editing.update((editing) => editing && { ...editing, x, y });
      }
    } catch (error) {
      this.toast.error(errorText(error, 'The place could not be moved.'));
    }
  }

  protected async deletePlace() {
    const editing = this.editing();
    const place = this.places().find((p) => p.id === editing?.id);
    if (!place) {
      return;
    }
    const stops = this.editingStops();
    const confirmed = await this.confirm.confirm({
      title: `Delete ${place.code}`,
      message:
        stops.length > 0
          ? `${plural(stops.length, 'stop')} lose this map location and stay otherwise unchanged: ${stops.map((stop) => stop.name).join(', ')}.`
          : 'No stop is linked to this place.',
      confirmLabel: 'Delete',
    });
    if (!confirmed) {
      return;
    }
    try {
      await this.mapService.deletePlace(place.id);
      await this.reloadPlaces();
      this.editing.set(null);
    } catch (error) {
      this.toast.error(errorText(error, 'The place could not be deleted.'));
    }
  }
}
