import { Component, computed, inject, signal } from '@angular/core';
import { StopService } from '../stop.service';
import { BASE_URL } from '../app.config';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Division, StopGroup } from '../types';
import { DivisionService } from '../division.service';
import { isValid } from '../utilfunctions';
import { firstValueFrom } from 'rxjs';
import { StopGroupService } from '../stopgroup.service';
import { ChipComponent } from '../chip/chip.component';
import { Location } from '@angular/common';

@Component({
  selector: 'app-stop-details',
  standalone: true,
  imports: [FormsModule, RouterModule, ChipComponent],
  templateUrl: './stop-details.component.html',
  styleUrl: './stop-details.component.css',
})
export class StopDetailsComponent {
  private service: StopService = inject(StopService);
  private divisionService: DivisionService = inject(DivisionService);
  private stopGroupService: StopGroupService = inject(StopGroupService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);

  baseUrl = inject(BASE_URL);

  stopId = signal<number>(-1);
  name = signal<string>('');
  description = signal<string>('');
  roomNr = signal<string>('');
  stopGroupIds: number[] = [];
  divisionIds = signal<number[]>([]);
  inactiveDivisions = computed(() =>
    this.divisions().filter((d) => !this.divisionIds().includes(d.id))
  );

  divisions = signal<Division[]>([]);
  stopGroups = signal<StopGroup[]>([]);

  errorMessage = signal<string | null>(null);

  async ngOnInit() {
    this.divisions.set(await this.divisionService.getDivisions());
    this.stopGroups.set(await this.stopGroupService.getStopGroups());
    const params = await firstValueFrom(this.route.queryParams);
    this.stopId.set(params['id'] || -1);
    this.name.set(params['name'] || '');
    this.description.set(params['description'] || '');
    this.roomNr.set(params['roomNr'] || '');
    this.stopGroupIds =
      params['stopGroupIds'].map((x: string) => parseInt(x)) || null;
    this.divisionIds.set(
      Array.from<string>(params['divisionIds']).map((x: string) =>
        parseInt(x)
      ) || []
    );
  }

  isInputValid() {
    if (!isValid(this.name(), 50)) {
      this.errorMessage.set('Name must be between 1 and 50 characters');
      return false;
    }
    if (!isValid(this.description(), 255)) {
      this.errorMessage.set('Description must be between 1 and 255 characters');
      return false;
    }
    if (!isValid(this.roomNr(), 50)) {
      this.errorMessage.set('Room number must be between 1 and 50 characters');
      return false;
    }
    return true;
  }
  async submitStopDetail() {
    if (!this.isInputValid()) {
      return;
    }
    if (this.stopId() === -1) {
      await this.service.addStop({
        name: this.name(),
        description: this.description(),
        roomNr: this.roomNr(),
        divisionIDs: this.divisionIds(),
        stopGroupIDs: this.stopGroupIds,
      });
    } else {
      await this.service.updateStopWithoutOrder({
        id: this.stopId(),
        name: this.name(),
        description: this.description(),
        roomNr: this.roomNr(),
        stopGroupIds: this.stopGroupIds,
        divisionIds: this.divisionIds(),
      });
    }
    this.location.back();
  }

  async deleteAndGoBack() {
    await this.service.deleteStop(this.stopId());
    this.location.back();
  }

  goBack() {
    this.location.back();
  }

  onDivisionSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const divisionId = parseInt(target.value);
    if (
      !this.divisionIds().includes(divisionId) &&
      this.divisions().find((d) => d.id === divisionId)
    ) {
      this.divisionIds.update((ids) => [...ids, divisionId]);
    }
  }

  onDivisionRemove(divisionId: number) {
    this.divisionIds.update((ids) => ids.filter((id) => id !== divisionId));
  }

  getDivisionById(id: number) {
    return this.divisions().find((division) => division.id === id);
  }
}
