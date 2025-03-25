import { Component, inject, signal } from '@angular/core';
import { StopOfStudent } from '../../types';
import { StopService } from '../../stop.service';
import { Status } from '../../types';

@Component({
  selector: 'app-student',
  imports: [],
  templateUrl: './student.component.html',
})
export class StudentComponent {
  private service: StopService = inject(StopService);

  stops = signal<StopOfStudent[]>([]);

  async ngOnInit() {
    this.stops.set(await this.service.getStopsOfStudent());
  }
  getStatusName(status: Status): string {
    return Status[status];
  }
}
