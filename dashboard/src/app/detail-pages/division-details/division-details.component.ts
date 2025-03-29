import {Component, inject, Input, OnInit, signal} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { BASE_URL } from '../../app.config';
import { isValid } from '../../utilfunctions';
import { firstValueFrom } from 'rxjs';
import {DivisionStore} from "../../store/division.store";
import {Division} from "../../types";

@Component({
    selector: 'app-division-details',
    standalone: true,
    imports: [FormsModule, RouterModule],
    templateUrl: './division-details.component.html',
})
export class DivisionDetailsComponent implements OnInit {
  private divisionStore = inject(DivisionStore);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);

  baseUrl = inject(BASE_URL);

  divisionId = signal<number>(-1);
  name = signal<string>('');
  color = signal<string>('');

  errorMessage = signal<string | null>(null);
  selectedFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;

  async ngOnInit() {
    const params = await firstValueFrom(this.route.queryParams);
    this.divisionId.set(params['id'] || -1);
    const division = this.divisionStore.divisions().find(d => d.id == this.divisionId());
    if (division) {
      this.name.set(division.name);
      this.color.set(division.color);
    }
    this.color.set(this.color() !== '' ? '#' + this.color().substring(1) : '');
  }

  async onFileChange(event: any) {
    const file: File = event.target.files[0];

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
    const division : Division = {
      id: this.divisionId(),
      name: this.name(),
      color: this.color(),
    };
    if (this.divisionId() === -1) {
      await this.divisionStore.addDivision(division, this.selectedFile);
    } else {
      await this.divisionStore.updateDivision(division);
    }
    if (this.selectedFile) {
      await this.divisionStore.updateDivisionImg(
        this.divisionId(),
        this.selectedFile
      );
    }
    this.selectedFile = null;
    this.filePreview = null;
    await this.router.navigate(['/divisions']);
  }

  async deleteAndGoBack() {
    await this.divisionStore.deleteDivision(this.divisionId());
    await this.router.navigate(['/divisions']);
  }

  async deleteImage() {
    this.selectedFile = null;
    this.filePreview = null;
    await this.divisionStore.deleteDivisionImg(this.divisionId());
  }
}
