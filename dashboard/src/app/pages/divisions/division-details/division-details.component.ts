import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { errorText } from '@/core/services/toast.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { BASE_URL } from '@/app.config';
import { isValidString } from '@/shared/utils/utils';
import { DivisionService } from '@/core/services/division.service';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';

@Component({
  selector: 'app-division-details',
  imports: [FormsModule, RouterModule, DeletePopupComponent, CdkTrapFocus],
  templateUrl: './division-details.component.html',
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class DivisionDetailsComponent implements OnInit {
  private divisionService = inject(DivisionService);
  private scrollService = inject(ScrollPersistenceService);

  id = input<number>(-1);
  cancel = output<void>();

  baseUrl = inject(BASE_URL);
  name = signal<string>('');
  color = signal<string>('');
  errorMessage = signal<string | null>(null);
  selectedFile: File | null = null;
  // A signal so the preview renders when the FileReader finishes.
  filePreview = signal<string | ArrayBuffer | null>(null);
  saving = signal<boolean>(false);

  cancelPopup() {
    this.cancel.emit();
  }

  // Esc closes the confirmation first when one is open on top.
  onEscape() {
    if (this.confirmAction() === null) {
      this.cancelPopup();
    }
  }

  async ngOnInit() {
    if (this.id() !== -1) {
      const divisions = await this.divisionService.getDivisions();
      const division = divisions.find((d) => d.id == this.id());

      if (division) {
        this.name.set(division.name);
        this.color.set(division.color);
      }
    }

    const currentColor = this.color();
    if (currentColor && !currentColor.startsWith('#')) {
      this.color.set('#' + currentColor);
    }
    this.scrollService.restoreScroll();
  }

  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    this.errorMessage.set(null);

    const validFileTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/svg+xml',
    ];

    if (!validFileTypes.includes(file.type)) {
      this.errorMessage.set(
        'Invalid file type. Please upload a JPG, JPEG, or PNG file.'
      );
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.filePreview.set(reader.result);
    reader.readAsDataURL(this.selectedFile);
  }

  isInputValid(): boolean {
    if (!isValidString(this.name(), 50)) {
      this.errorMessage.set('Name must be between 1 and 50 characters');
      return false;
    }
    if (!isValidString(this.color(), 7)) {
      this.errorMessage.set('Color must be a valid hex color');
      return false;
    }
    return true;
  }

  async submitDivisionDetail() {
    if (!this.isInputValid()) {
      return;
    }

    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.errorMessage.set(null);
    try {
      let id = this.id();
      if (id === -1) {
        // The image belongs to the division that was just created.
        const created = await this.divisionService.addDivision({
          name: this.name(),
          color: this.color(),
        });
        id = created.id;
      } else {
        await this.divisionService.updateDivision({
          id,
          name: this.name(),
          color: this.color(),
        });
      }

      if (this.selectedFile) {
        await this.divisionService.updateDivisionImg(id, this.selectedFile);
      }
    } catch (error) {
      console.error('Failed to save division', error);
      this.errorMessage.set(
        errorText(error, 'The division could not be saved. Please try again.')
      );
      return;
    } finally {
      this.saving.set(false);
    }

    this.selectedFile = null;
    this.filePreview.set(null);
    this.cancel.emit();
  }

  confirmAction = signal<'division' | 'image' | null>(null);
  deleting = signal<boolean>(false);
  imageDeleted = signal<boolean>(false);

  deleteDivisionMessage = computed(
    () =>
      `"${this.name()}" will be permanently deleted.\n` +
      'Its stops stay, but are no longer linked to this division.'
  );
  deleteImageMessage = computed(
    () => `The image of "${this.name()}" will be permanently deleted.`
  );

  async deleteAndGoBack() {
    this.deleting.set(true);
    try {
      await this.divisionService.deleteDivision(this.id());
      this.confirmAction.set(null);
      this.cancel.emit();
    } catch (error) {
      console.error('Failed to delete division', error);
      this.errorMessage.set(
        'The division could not be deleted. Please try again.'
      );
      this.confirmAction.set(null);
    } finally {
      this.deleting.set(false);
    }
  }

  // Discards a newly chosen file; the stored image is untouched.
  clearPreview() {
    this.selectedFile = null;
    this.filePreview.set(null);
  }

  async deleteImage() {
    this.deleting.set(true);
    try {
      await this.divisionService.deleteDivisionImg(this.id());
      this.clearPreview();
      this.imageDeleted.set(true);
    } catch (error) {
      console.error('Failed to delete division image', error);
      this.errorMessage.set(
        'The image could not be deleted. Please try again.'
      );
    } finally {
      this.deleting.set(false);
      this.confirmAction.set(null);
    }
  }
}
