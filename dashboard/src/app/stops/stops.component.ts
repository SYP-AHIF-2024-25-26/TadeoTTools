import { Component, inject, OnInit, signal } from '@angular/core';
import { StopService } from '../stop.service';
import { Stop } from '../types';

@Component({
  selector: 'app-stops',
  standalone: true,
  imports: [],
  templateUrl: './stops.component.html',
  styleUrl: './stops.component.css'
})
export class StopsComponent implements OnInit{
  private service: StopService = inject(StopService);
  stops = signal<Stop[]>([]);

  async ngOnInit() {
    this.stops.set(await this.service.getStops());
  }

  async deleteStop(stopId: number) {
    await this.service.deleteStop(stopId);
    this.stops.set(await this.service.getStops());
  }
}
