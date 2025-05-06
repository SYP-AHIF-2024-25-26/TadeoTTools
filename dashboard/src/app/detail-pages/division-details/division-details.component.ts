import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '../../app.config';
import { isValid } from '../../utilfunctions';
import { DivisionStore } from '../../store/division.store';
import { Division, Info } from '../../types';
import { InfoStore } from '../../store/info.store';

@Component({
  selector: 'app-division-details',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './division-details.component.html',
})
export class DivisionDetailsComponent implements OnInit {
  private divisionStore = inject(DivisionStore);
  private infoStore = inject(InfoStore);

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
    let maybeDivision: Division | undefined = undefined;
    while (maybeDivision === undefined) {
      maybeDivision = this.divisionStore.divisions().find((d) => d.id == this.id);
      if (maybeDivision === undefined) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    if (maybeDivision) {
      this.name.set(maybeDivision.name);
      this.color.set(maybeDivision.color);
    }
    this.color.set(this.color() !== '' ? '#' + this.color().substring(1) : '');
  }

  async onFileChange(event: any) {
    const file: File = event.target.files[0];

    this.errorMessage.set(null);

    if (file) {
      const validFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml'];
      if (!validFileTypes.includes(file.type)) {
        this.errorMessage.set('Invalid file type. Please upload a JPG, JPEG, or PNG file.');
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
    let isError;
    if (this.id === -1) {
      isError = await this.divisionStore.addDivision(division, this.selectedFile);
      if (isError.isError) {
        this.infoStore.addInfo({type: 'error', message: 'Error occurred while adding division'} as Info);
        return;
      } else {
        this.infoStore.addInfo({type: 'info', message: 'Division added successfully'} as Info);
      }
    } else {
      isError = await this.divisionStore.updateDivision(division);
      if (isError.isError) {
        this.infoStore.addInfo({type: 'error', message: 'Error occurred while updating division'} as Info);
        return;
      } else {
        this.infoStore.addInfo({type: 'info', message: 'Division updated successfully'} as Info);
      }
    }
    if (this.selectedFile) {
      isError = await this.divisionStore.updateDivisionImg(this.id, this.selectedFile);
      if (isError.isError) {
        this.infoStore.addInfo({type: 'error', message: 'Error occurred while updating division image'} as Info);
      }
    }
    this.selectedFile = null;
    this.filePreview = null;
    this.cancel.emit();
  }

  async deleteAndGoBack() {
    const isError = await this.divisionStore.deleteDivision(this.id);
    if (isError.isError) {
      this.infoStore.addInfo({type: 'error', message: 'Error occurred while deleting division'} as Info);
    } else {
      this.infoStore.addInfo({type: 'info', message: 'Division deleted succesfully'} as Info);
      console.log(this.infoStore.infos());
    }
    this.cancel.emit();
  }

  async deleteImage() {
    this.selectedFile = null;
    this.filePreview = null;
    const isError = await this.divisionStore.deleteDivisionImg(this.id);
    if (isError.isError) {
      this.infoStore.addInfo({type: 'error', message: 'Error occurred while deleting division image'} as Info);
    } else {
      this.infoStore.addInfo({type: 'info', message: 'Division image deleted successfully'} as Info);
    }
  }
}
