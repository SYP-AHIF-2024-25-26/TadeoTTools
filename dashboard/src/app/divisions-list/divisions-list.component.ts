import { Component, inject, OnInit, signal } from '@angular/core';
import { DivisionService } from '../division.service';
import { Division } from '../types';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '../app.config';
import { DeletePopupComponent } from '../delete-popup/delete-popup.component';

@Component({
  selector: 'app-divisions-list',
  standalone: true,
  imports: [RouterModule, DeletePopupComponent],
  templateUrl: './divisions-list.component.html',
  styleUrl: './divisions-list.component.css',
})
export class DivisionsListComponent implements OnInit {
  private service: DivisionService = inject(DivisionService);
  divisions = signal<Division[]>([]);

  baseUrl = inject(BASE_URL);
  divisionIdToRemove: number = -1;
  showRemoveDivisionPopup = signal<boolean>(false);

  async ngOnInit() {
    this.divisions.set(await this.service.getDivisions());
  }

  async deleteDivision() {
    await this.service.deleteDivision(this.divisionIdToRemove);
    this.showRemoveDivisionPopup.set(false);
    this.divisions.set(await this.service.getDivisions());
  }

  showDeletePopup(divisionId: number): void {
    this.divisionIdToRemove = divisionId;
    this.showRemoveDivisionPopup.set(true);
  }

  hideImage(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }
}
