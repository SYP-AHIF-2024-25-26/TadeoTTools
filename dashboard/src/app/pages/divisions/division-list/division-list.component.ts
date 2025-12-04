import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '../../../app.config';
import { DeletePopupComponent } from '../../../shared/modals/confirmation-modal/confirmation-modal.component';
import { DivisionDetailsComponent } from '../division-details/division-details.component';
import { DivisionService } from '../../../core/services/division.service';
import { Division } from '../../../shared/models/types';

@Component({
  selector: 'app-divisions-list',
  standalone: true,
  imports: [RouterModule, DeletePopupComponent, DivisionDetailsComponent],
  templateUrl: './division-list.component.html',
})
export class DivisionsListComponent {
  private divisionService = inject(DivisionService);

  divisions = signal<Division[]>([]);
  baseUrl = inject(BASE_URL);
  divisionIdToRemove: number = -1;
  divisionIdDetail: number = -1;
  showRemoveDivisionPopUp = signal<boolean>(false);
  showDivisionDetailPopUp = signal<boolean>(false);

  async ngOnInit() {
    this.divisions.set(await this.divisionService.getDivisions());
  }

  async deleteDivision() {
    await this.divisionService.deleteDivision(this.divisionIdToRemove);
    this.showRemoveDivisionPopUp.set(false);
    this.divisions.set(await this.divisionService.getDivisions());
  }

  showDeletePopup(divisionId: number): void {
    this.divisionIdToRemove = divisionId;
    this.showRemoveDivisionPopUp.set(true);
  }
  showDivisionPopUp(id: number): void {
    this.divisionIdDetail = id;
    this.showDivisionDetailPopUp.set(true);
  }

  async handleDivisionPopupClose(): Promise<void> {
    this.showDivisionDetailPopUp.set(false);
    this.divisions.set(await this.divisionService.getDivisions());
  }

  hideImage(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }
}
