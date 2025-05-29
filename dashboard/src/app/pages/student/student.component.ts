import {Component, inject, OnInit, signal} from '@angular/core';
import { StopOfStudent } from '../../types';
import { StopService } from '../../stop.service';
import { Status } from '../../types';

@Component({
  selector: 'app-student',
  imports: [],
  templateUrl: './student.component.html',
})
export class StudentComponent implements OnInit{
  private stopService: StopService = inject(StopService);

  stops = signal<StopOfStudent[]>([]);

  async ngOnInit() {
    this.stops.set(await this.stopService.getStopsOfStudent());
  }
  getStatusName(status: Status): string {
    return Status[status];
  }
}
