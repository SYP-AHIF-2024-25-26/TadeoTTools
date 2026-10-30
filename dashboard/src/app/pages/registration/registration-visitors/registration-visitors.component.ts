import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RegistrationService } from '@/core/services/registration.service';
import { errorText, ToastService } from '@/core/services/toast.service';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { VisitorSummary } from '@/shared/models/types';
import { downloadFile, plural } from '@/shared/utils/utils';

type Deleting = 'visitors' | 'photos';

@Component({
  selector: 'app-registration-visitors',
  templateUrl: './registration-visitors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DeletePopupComponent],
})
export class RegistrationVisitorsComponent {
  private registrationService = inject(RegistrationService);
  private toast = inject(ToastService);

  summary = input.required<VisitorSummary>();
  changed = output<void>();

  protected readonly plural = plural;

  protected downloading = signal<'csv' | 'zip' | null>(null);
  protected confirming = signal<Deleting | null>(null);
  protected deleting = signal(false);

  protected withCompany = computed(
    () => this.summary().count + this.summary().adultsCount
  );

  async downloadCsv(): Promise<void> {
    await this.download('csv', 'visitors.csv', () =>
      this.registrationService.getVisitorsFile()
    );
  }

  async downloadPhotos(): Promise<void> {
    await this.download('zip', 'visitor-photos.zip', () =>
      this.registrationService.getPhotosFile()
    );
  }

  private async download(
    kind: 'csv' | 'zip',
    filename: string,
    get: () => Promise<Blob>
  ): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(kind);
    try {
      downloadFile(await get(), filename);
    } catch (error) {
      console.error(`Failed to download ${filename}`, error);
      this.toast.error(
        errorText(error, `${filename} could not be downloaded.`)
      );
    } finally {
      this.downloading.set(null);
    }
  }

  protected deleteMessage(): string {
    const s = this.summary();
    if (this.confirming() === 'photos') {
      return (
        `This deletes ${plural(s.photoCount, 'photo')}. The registrations stay. ` +
        "This can't be undone, so download the photos first if you want to keep them."
      );
    }
    const photos =
      s.photoCount > 0 ? ` and ${plural(s.photoCount, 'photo')}` : '';
    return (
      `This deletes ${plural(s.count, 'registration')}${photos}, and the next registration gets number 1 again. ` +
      "This can't be undone, so export the CSV first if you want to keep the registrations."
    );
  }

  // The popup's second button exports what is about to be deleted.
  protected async exportFirst(): Promise<void> {
    if (this.confirming() === 'photos') await this.downloadPhotos();
    else await this.downloadCsv();
  }

  protected async deleteConfirmed(): Promise<void> {
    const what = this.confirming();
    if (!what || this.deleting()) return;
    this.deleting.set(true);
    try {
      const result =
        what === 'photos'
          ? await this.registrationService.deletePhotos()
          : await this.registrationService.deleteVisitors();
      this.confirming.set(null);
      this.toast.success(
        what === 'photos'
          ? `${plural(result.photos, 'photo')} deleted.`
          : `${plural(result.visitors, 'registration')} and ${plural(result.photos, 'photo')} deleted.`
      );
      this.changed.emit();
    } catch (error) {
      this.toast.error(errorText(error, 'The deletion failed.'));
    } finally {
      this.deleting.set(false);
    }
  }
}
