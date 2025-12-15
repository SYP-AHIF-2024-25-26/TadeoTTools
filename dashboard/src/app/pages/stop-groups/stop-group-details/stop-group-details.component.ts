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
import { isValidString } from '../../../shared/utils/utils';
import { StopGroup } from '../../../shared/models/types';
import { StopGroupService } from '../../../core/services/stopgroup.service';

@Component({
  selector: 'app-stopgroup-details',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './stop-group-details.component.html',
})
export class StopgroupDetailsComponent implements OnInit {
  private stopGroupService = inject(StopGroupService);

  @Input() id: number = -1;
  @Output() cancel = new EventEmitter<void>();

  name = signal<string>('');
  description = signal<string>('');
  isPublic = signal<boolean>(false);
  stopIds = signal<number[]>([]);
  errorMessage = signal<string>('');
  stopGroups = signal<StopGroup[]>([]);

  cancelPopup() {
    this.cancel.emit();
  }

  async ngOnInit() {
    if (this.id === -1) {
      return;
    }

    const stopGroup = await this.stopGroupService.getStopGroupById(this.id);
    if (stopGroup) {
      this.name.set(stopGroup.name);
      this.stopIds.set(stopGroup.stopIds);
      this.description.set(stopGroup.description);
      this.isPublic.set(stopGroup.isPublic);
    }
  }

  isInputValid(): boolean {
    if (this.name() === '') {
      this.errorMessage.set('Name is required');
      return false;
    } else if (!isValidString(this.name(), 50)) {
      this.errorMessage.set('Name is invalid, must be less than 50 characters');
      return false;
    }
    if (this.description() === '') {
      this.errorMessage.set('Description is required');
      return false;
    } else if (!isValidString(this.description(), 255)) {
      this.errorMessage.set(
        'Description is invalid, must be less than 255 characters'
      );
      return false;
    }
    return true;
  }

  async submitStopGroupDetails() {
    if (!this.isInputValid()) {
      return;
    }

    try {
      if (this.id === -1) {
        const createRequest = {
          name: this.name(),
          description: this.description(),
          isPublic: this.isPublic(),
        };
        await this.stopGroupService.addStopGroup(createRequest);
      } else {
        const updateRequest = {
          id: this.id,
          name: this.name(),
          description: this.description(),
          isPublic: this.isPublic(),
          stopIds: this.stopIds(),
        };
        await this.stopGroupService.updateStopGroup(updateRequest);
      }
    } catch (error) {
      this.errorMessage.set('An error occurred while saving.');
    }
    this.cancel.emit();
  }

  async deleteAndGoBack() {
    await this.stopGroupService.deleteStopGroup(this.id);
    this.cancel.emit();
  }

  goBack() {
    this.cancel.emit();
  }
}
