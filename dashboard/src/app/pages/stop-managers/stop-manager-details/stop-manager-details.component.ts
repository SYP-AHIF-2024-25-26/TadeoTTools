import { Component, computed, inject, OnInit, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StopService } from '@/core/services/stop.service';
import { Stop, StopManager } from '@/shared/models/types';
import { StopManagerService } from '@/core/services/stop-manager.service';

@Component({
  selector: 'app-stop-manager-details',
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './stop-manager-details.component.html',
})
export class StopManagerDetailsComponent implements OnInit {
  private stopService = inject(StopService);
  private stopManagerService = inject(StopManagerService);
  stops = signal<Stop[]>([]);
  keycloak = inject(Keycloak);

  username = signal<string>('');
  stopManager = signal<StopManager | null>(null);

  async ngOnInit() {
    const userProfile = await this.keycloak.loadUserProfile();
    const username = userProfile.username || '';
    this.username.set(username);
    this.stops.set(await this.stopService.getStopsForStopManager(username));
    try {
      this.stopManager.set(
        await this.stopManagerService.getStopManagerById(username)
      );
    } catch (e) {
      console.error('Failed to load stop manager profile', e);
    }
  }
}
