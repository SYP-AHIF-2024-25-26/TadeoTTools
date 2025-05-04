import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '../../app.config';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';
import { DivisionStore } from '../../store/division.store';
import { DivisionDetailsComponent } from '../../detail-pages/division-details/division-details.component';

@Component({
  selector: 'app-divisions-list',
  standalone: true,
  imports: [RouterModule, DeletePopupComponent, DivisionDetailsComponent],
  templateUrl: './divisions-list.component.html',
})
export class DivisionsListComponent {
  public divisionStore = inject(DivisionStore);
  baseUrl = inject(BASE_URL);
  divisionIdToRemove: number = -1;
  divisionIdDetail: number = -1;
  showRemoveDivisionPopUp = signal<boolean>(false);
  showDivisionDetailPopUp = signal<boolean>(false);

  async deleteDivision() {
    await this.divisionStore.deleteDivision(this.divisionIdToRemove);
    this.showRemoveDivisionPopUp.set(false);
  }

  showDeletePopup(divisionId: number): void {
    this.divisionIdToRemove = divisionId;
    this.showRemoveDivisionPopUp.set(true);
  }
  showDivisionPopUp(id: number): void {
    this.divisionIdDetail = id;
    this.showDivisionDetailPopUp.set(true);
  }

  hideImage(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }
}
