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

  async ngOnInit() {
    this.stops.set(await this.stopService.getStopsOfStudent());
    this.scrollService.restoreScroll();
  }
  getStatusName(status: Status): string {
    return Status[status];
  }
}
