import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '../../app.config';
import { isValid } from '../../utilfunctions';
import { Division } from '../../types';
import { DivisionService } from '../../division.service';

@Component({
  selector: 'app-division-details',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './division-details.component.html',
})
export class DivisionDetailsComponent implements OnInit {
  private divisionService = inject(DivisionService);

  @Input() id: number = -1;
  @Output() cancel = new EventEmitter<void>();

  cancelPopup() {
    this.cancel.emit();
  }

  baseUrl = inject(BASE_URL);
  name = signal<string>('');
  color = signal<string>('');

  errorMessage = signal<string | null>(null);
  selectedFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;

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
  }

  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    this.errorMessage.set(null);

    if (file) {
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
  }

  isInputValid(): boolean {
    if (!isValid(this.name(), 50)) {
      this.errorMessage.set('Name must be between 1 and 50 characters');
      return false;
    }
    if (!isValid(this.color(), 7)) {
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
      await this.divisionService.addDivision(division);
    } else {
      await this.divisionService.updateDivision(division);
    }
    if (this.selectedFile) {
      await this.divisionService.updateDivisionImg(this.id, this.selectedFile);
    }
    this.selectedFile = null;
    this.filePreview = null;
    this.cancel.emit();
  }

  async deleteAndGoBack() {
    await this.divisionService.deleteDivision(this.id);
    this.cancel.emit();
  }

  async deleteImage() {
    this.selectedFile = null;
    this.filePreview = null;
    await this.divisionService.deleteDivisionImg(this.id);
  }
}
