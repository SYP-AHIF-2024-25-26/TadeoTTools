import { Component, inject, OnInit, signal } from '@angular/core';
import { StopOfStudent } from '@/shared/models/types';
import { StopService } from '@/core/services/stop.service';
import { Status } from '@/shared/models/types';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';

@Component({
  selector: 'app-student',
  imports: [],
  templateUrl: './student-details.component.html',
})
export class StudentComponent implements OnInit {
  private stopService: StopService = inject(StopService);
  private scrollService = inject(ScrollPersistenceService);

  stops = signal<StopOfStudent[]>([]);
  loading = signal<boolean>(true);
  loadFailed = signal<boolean>(false);

  async ngOnInit() {
    await this.loadStops();
    this.scrollService.restoreScroll();
  }

  async loadStops() {
    this.loading.set(true);
    this.loadFailed.set(false);
    try {
      this.stops.set(await this.stopService.getStopsOfStudent());
    } catch (e) {
      console.error('Failed to load stops of student', e);
      this.loadFailed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
  getStatusText(status: Status): string {
    switch (status) {
      case Status.Accepted:
        return 'Approved';
      case Status.Declined:
        return 'Not selected for this stop';
      default:
        return 'Waiting for approval';
    }
  }
}
