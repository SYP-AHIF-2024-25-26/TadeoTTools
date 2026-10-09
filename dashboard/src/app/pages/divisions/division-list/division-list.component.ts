import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '@/app.config';
import { ConfirmDialogService } from '@/core/services/confirm-dialog.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { DivisionDetailsComponent } from '@/pages/divisions/division-details/division-details.component';
import { DivisionService } from '@/core/services/division.service';
import { Division } from '@/shared/models/types';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';
import { downloadFile } from '@/shared/utils/utils';
import { ActionIconComponent } from '@/shared/components/action-icon/action-icon.component';

// The Divisions tab of Users & Data.
@Component({
  selector: 'app-divisions-list',
  imports: [RouterModule, DivisionDetailsComponent, ActionIconComponent],
  templateUrl: './division-list.component.html',
})
export class DivisionsListComponent {
  private divisionService = inject(DivisionService);
  private scrollService = inject(ScrollPersistenceService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  divisions = signal<Division[]>([]);
  // Changes on every reload so a replaced image is fetched again.
  imageVersion = signal(Date.now());
  baseUrl = inject(BASE_URL);
  divisionIdDetail: number = -1;
  showDivisionDetailPopUp = signal<boolean>(false);

  async ngOnInit() {
    this.divisions.set(await this.divisionService.getDivisions());
    this.imageVersion.set(Date.now());
    this.scrollService.restoreScroll();
  }

  async deleteDivision(division: Division): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Division',
      message:
        `"${division.name}" will be permanently deleted.
` + 'Its stops stay, but are no longer linked to this division.',
      confirmLabel: 'Delete Division',
    });
    if (!confirmed) return;
    try {
      await this.divisionService.deleteDivision(division.id);
    } catch (error) {
      this.toast.error(
        errorText(error, `"${division.name}" could not be deleted.`)
      );
    }
    this.divisions.set(await this.divisionService.getDivisions());
    this.imageVersion.set(Date.now());
  }
  showDivisionPopUp(id: number): void {
    this.divisionIdDetail = id;
    this.showDivisionDetailPopUp.set(true);
  }

  async handleDivisionPopupClose(): Promise<void> {
    this.showDivisionDetailPopUp.set(false);
    this.divisions.set(await this.divisionService.getDivisions());
    this.imageVersion.set(Date.now());
  }

  async downloadDivisionData() {
    try {
      const blob = await this.divisionService.getDivisionDataFile();
      downloadFile(blob, 'division_data.csv');
    } catch (error) {
      console.error('Failed to download file:', error);
      this.toast.error(
        errorText(error, 'The division data could not be downloaded.')
      );
    }
  }

  hideImage(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
  }
}
