import { Component, inject, OnInit, signal } from '@angular/core';
import { DivisionService } from '../../division.service';
import { Division } from '../../types';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '../../app.config';
import { DeletePopupComponent } from '../../popups/delete-popup/delete-popup.component';
import {DivisionStore} from "../../store/division.store";

@Component({
    selector: 'app-divisions-list',
    standalone: true,
    imports: [RouterModule, DeletePopupComponent],
    templateUrl: './divisions-list.component.html',
})
export class DivisionsListComponent {
  public divisionStore = inject(DivisionStore);
  baseUrl = inject(BASE_URL);
  divisionIdToRemove: number = -1;
  showRemoveDivisionPopup = signal<boolean>(false);

  async deleteDivision() {
    await this.divisionStore.deleteDivision(this.divisionIdToRemove);
    this.showRemoveDivisionPopup.set(false);
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
