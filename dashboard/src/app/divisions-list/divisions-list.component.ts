import { Component, inject, OnInit, signal } from '@angular/core';
import { DivisionService } from '../division.service';
import { Division } from '../types';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '../app.config';

@Component({
  selector: 'app-divisions-list',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './divisions-list.component.html',
  styleUrl: './divisions-list.component.css',
})
export class DivisionsListComponent implements OnInit {
  private service: DivisionService = inject(DivisionService);
  divisions = signal<Division[]>([]);

  baseUrl = inject(BASE_URL);

  async ngOnInit() {
    this.divisions.set(await this.service.getDivisions());
  }

  async deleteDivision(divisionId: number) {
    await this.service.deleteDivision(divisionId);
    this.divisions.set(await this.service.getDivisions());
  }

  hideImage(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }
}
