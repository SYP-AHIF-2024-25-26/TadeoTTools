import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';
import { BASE_URL } from '@/app.config';
import { isValidString } from '@/shared/utils/utils';
import { Division } from '@/shared/models/types';
import { DivisionService } from '@/core/services/division.service';
import { ScrollPersistenceService } from '@/core/services/scroll-persistence.service';

@Component({
  selector: 'app-division-details',
  standalone: true,
  imports: [FormsModule, RouterModule, DeletePopupComponent],
  templateUrl: './division-details.component.html',
})
export class DivisionDetailsComponent implements OnInit {
  private divisionService = inject(DivisionService);
  private scrollService = inject(ScrollPersistenceService);

  @Input() id: number = -1;
  @Output() cancel = new EventEmitter<void>();

  baseUrl = inject(BASE_URL);
  name = signal<string>('');
  color = signal<string>('');
  errorMessage = signal<string | null>(null);
  selectedFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;

  cancelPopup() {
    this.cancel.emit();
  }

  async ngOnInit() {
    if (this.id !== -1) {
      const divisions = await this.divisionService.getDivisions();
      const division = divisions.find((d) => d.id == this.id);

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
    reader.onload = () => (this.filePreview = reader.result);
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

    const division: Division = {
      id: this.id,
      name: this.name(),
      color: this.color(),
    };

    if (this.id === -1) {
      await this.divisionService.addDivision({
        name: this.name(),
        color: this.color(),
      });
    } else {
      await this.divisionService.updateDivision({
        id: this.id,
        name: this.name(),
        color: this.color(),
      });
    }

    if (this.selectedFile) {
      await this.divisionService.updateDivisionImg(this.id, this.selectedFile);
    }

    this.selectedFile = null;
    this.filePreview = null;
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
      await this.divisionService.deleteDivision(this.id);
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
    this.filePreview = null;
  }

  async deleteImage() {
    this.deleting.set(true);
    try {
      await this.divisionService.deleteDivisionImg(this.id);
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
