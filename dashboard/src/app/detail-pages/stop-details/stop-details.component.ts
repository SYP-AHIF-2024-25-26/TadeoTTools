import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {StopService} from '../../stop.service';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {Stop} from '../../types';
import {isValid} from '../../utilfunctions';
import {firstValueFrom} from 'rxjs';
import {ChipComponent} from '../../standard-components/chip/chip.component';
import {Location} from '@angular/common';
import {StopStore} from "../../store/stop.store";
import {DivisionStore} from "../../store/division.store";
import {StopGroupStore} from "../../store/stopgroup.store";

@Component({
  selector: 'app-stop-details',
  standalone: true,
  imports: [FormsModule, RouterModule, ChipComponent],
  templateUrl: './stop-details.component.html',
  styleUrl: './stop-details.component.css'
})
export class StopDetailsComponent implements OnInit {
  private stopStore = inject(StopStore);
  protected divisionStore = inject(DivisionStore);
  protected stopGroupStore = inject(StopGroupStore);
  private service: StopService = inject(StopService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);

  emptyStop = {
    id: -1,
    name: '',
    description: '',
    roomNr: '',
    divisionIds: [],
    stopGroupIds: [],
    teachers: [],
    orders: []
  };
  stop = signal<Stop>(this.emptyStop);

  inactiveDivisions = computed(() =>
    this.divisionStore.divisions().filter((d) => !this.stop()?.divisionIds.includes(d.id))
  );

  errorMessage = signal<string | null>(null);

  async ngOnInit() {
    const params = await firstValueFrom(this.route.queryParams);
    const id = params['id'] || -1;
    const maybeStop = this.stopStore.stops().find(s => s.id == id);
    if (maybeStop) {
      this.stop.set(maybeStop)
    }
  }

  isInputValid() {
    if (!isValid(this.stop().name, 50)) {
      this.errorMessage.set('Name must be between 1 and 50 characters');
      return false;
    }
    if (!isValid(this.stop().description, 255)) {
      this.errorMessage.set('Description must be between 1 and 255 characters');
      return false;
    }
    if (!isValid(this.stop().roomNr, 50)) {
      this.errorMessage.set('Room number must be between 1 and 50 characters');
      return false;
    }
    return true;
  }

  async submitStopDetail() {
    if (!this.isInputValid()) {
      return;
    }
    if (this.stop().id === -1) {
      await this.service.addStop(this.stop());
    } else {
      await this.stopStore.updateStop(this.stop());
    }
    this.stop.set(this.emptyStop);
    this.location.back();
  }

  async deleteAndGoBack() {
    await this.stopStore.deleteStop(this.stop().id);
    this.stop.set(this.emptyStop);
    this.location.back();
  }

  goBack() {
    this.stop.set(this.emptyStop);
    this.location.back();
  }

  async onDivisionSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const divisionId = parseInt(target.value);
    if (
      !this.stop().divisionIds.includes(divisionId) &&
      this.divisionStore.divisions().find((d) => d.id === divisionId)
    ) {
      this.stop.update((stop) => {
        stop.divisionIds = [divisionId, ...stop.divisionIds];
        return stop;
      });
    }
  }

  onDivisionRemove(divisionId: number) {
    this.stop.update((stop) => {
      stop.divisionIds = stop.divisionIds.filter((ids) => ids !== divisionId);
      return stop;
    });
  }
}
