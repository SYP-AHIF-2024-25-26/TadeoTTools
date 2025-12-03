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
import { isValid } from '../../utilfunctions';
import { Location } from '@angular/common';
import { StopGroup } from '../../types';
import { StopGroupService } from '../../stopgroup.service';

@Component({
  selector: 'app-stopgroup-details',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './stopgroup-details.component.html',
})
export class StopgroupDetailsComponent implements OnInit {
  private location: Location = inject(Location);
  private stopGroupService = inject(StopGroupService);

  @Input() id: number = -1;
  @Output() cancel = new EventEmitter<void>();

  cancelPopup() {
    this.cancel.emit();
  }

  name = signal<string>('');
  description = signal<string>('');
  isPublic = signal<boolean>(false);
  stopIds = signal<number[]>([]);
  errorMessage = signal<string>('');
  stopGroups = signal<StopGroup[]>([]);

  async ngOnInit() {
    this.stopGroups.set(await this.stopGroupService.getStopGroups());

    let stopGroup: StopGroup | undefined = undefined;
    while (stopGroup === undefined) {
      stopGroup = this.stopGroups().find((g) => g.id == this.id);
      if (stopGroup === undefined) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    this.name.set(stopGroup.name);
    this.stopIds.set(stopGroup.stopIds);
    this.description.set(stopGroup.description);
    this.isPublic.set(stopGroup.isPublic);
  }

  isInputValid(): boolean {
    if (this.name() === '') {
      this.errorMessage.set('Name is required');
      return false;
    } else if (!isValid(this.name(), 50)) {
      this.errorMessage.set('Name is invalid, must be less than 50 characters');
      return false;
    }
    if (this.description() === '') {
      this.errorMessage.set('Description is required');
      return false;
    } else if (!isValid(this.description(), 255)) {
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

    const stopGroup: StopGroup = {
      id: this.id,
      name: this.name(),
      description: this.description(),
      isPublic: this.isPublic(),
      stopIds: this.stopIds(),
    };

    try {
      if (this.id === -1) {
        await this.stopGroupService.addStopGroup(stopGroup);
      } else {
        await this.stopGroupService.updateStopGroup(stopGroup);
      }
    } catch (error) {
      // Error is already handled by the service
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
