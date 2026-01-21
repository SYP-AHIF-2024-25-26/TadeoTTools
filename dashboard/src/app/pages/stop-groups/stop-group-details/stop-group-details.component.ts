import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { isValidString } from '@/shared/utils/utils';
import { StopGroup, Stop } from '@/shared/models/types';
import { StopGroupService } from '@/core/services/stopgroup.service';
import { StopService } from '@/core/services/stop.service';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import {
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { LoginService } from '@/core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { LoaderComponent } from '@/shared/components/loading-spinner/loading-spinner.component';
import {
  StopGroupGeneralInfoComponent
} from '@/pages/stop-groups/stop-group-details/stop-group-general-info/stop-group-general-info.component';
import {
  StopGroupStopSelectorComponent
} from '@/pages/stop-groups/stop-group-details/stop-group-stop-selector/stop-group-stop-selector.component';

@Component({
  selector: 'app-stopgroup-details',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    DragDropModule,
    LoaderComponent,
    StopGroupGeneralInfoComponent,
    StopGroupStopSelectorComponent,
  ],
  templateUrl: './stop-group-details.component.html',
})
export class StopgroupDetailsComponent implements OnInit {
  private stopGroupService = inject(StopGroupService);
  private stopService = inject(StopService);
  private loginService = inject(LoginService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);
  router = inject(Router);
  private scrollService = inject(ScrollPersistenceService);

  stops = signal<Stop[]>([]);

  isLoading = signal<boolean>(true);

  emptyStopGroup = {
    id: -1,
    name: '',
    description: '',
    isPublic: false,
    stopIds: [],
    order: 0,
  };

  stopGroup = signal<StopGroup>(this.emptyStopGroup);

  includedStops = computed(() => {
    const stopMap = new Map(this.stops().map((s) => [s.id, s]));
    return this.stopGroup()
      .stopIds.map((id) => stopMap.get(id))
      .filter((s): s is Stop => s !== undefined);
  });

  availableStops = computed(() => {
    return this.stops().filter(
      (stop) => !this.stopGroup().stopIds.includes(stop.id)
    );
  });

  isAdmin = signal(false);
  errorMessage = signal<string | null>(null);

  async ngOnInit() {
    this.isLoading.set(true);
    try {
      const response = await this.loginService.checkUserRole(
        'in-database',
        'admin'
      );
      this.isAdmin.set(response);

      const params = await firstValueFrom(this.route.queryParams);
      const id = params['id'] || -1;

      this.stops.set(await this.stopService.getStops());

      if (id === -1) {
        this.stopGroup.set({ ...this.emptyStopGroup });
        return;
      }

      const foundStopGroup = await this.stopGroupService.getStopGroupById(
        Number(id)
      );
      if (foundStopGroup === undefined) {
        this.errorMessage.set(`Could not find stopGroup with ID ${id}`);
      } else {
        this.stopGroup.set({ ...foundStopGroup });
      }
    } catch (error) {
      this.errorMessage.set('An error occurred while loading data.');
    } finally {
      this.isLoading.set(false);
    }
    this.scrollService.restoreScroll();
  }

  isInputValid() {
    if (!isValidString(this.stopGroup().name, 50)) {
      this.errorMessage.set('Name must be between 1 and 50 characters');
      return false;
    }
    if (!isValidString(this.stopGroup().description, 255)) {
      this.errorMessage.set('Description must be between 1 and 255 characters');
      return false;
    }
    return true;
  }

  async submitStopGroupDetail() {
    if (!this.isInputValid()) {
      return;
    }
    if (this.stopGroup().id === -1) {
      const returnedStop = await this.stopGroupService.addStopGroup(
        this.stopGroup()
      );
      this.stopGroup.set({ ...this.stopGroup(), id: returnedStop.id });
    } else {
      await this.stopGroupService.updateStopGroup(this.stopGroup());
    }
    this.location.back();
  }

  async deleteAndGoBack() {
    await this.stopGroupService.deleteStopGroup(this.stopGroup().id);
    this.location.back();
  }

  goBack() {
    this.location.back();
  }

  protected readonly stop = stop;
}
