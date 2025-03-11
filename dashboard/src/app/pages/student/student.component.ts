import { Component, inject, signal } from '@angular/core';
import { LoginService } from '../../login.service';
import { StopOfStudent } from '../../types';
import { StopService } from '../../stop.service';

@Component({
  selector: 'app-student',
  imports: [],
  templateUrl: './student.component.html',
  styleUrl: './student.component.css'
})
export class StudentComponent {
  private service: StopService = inject(StopService);

  stops = signal<StopOfStudent[]>([]);

  async ngOnInit() {
    this.stops.set(await this.service.getStopsOfStudent());
  }

}
