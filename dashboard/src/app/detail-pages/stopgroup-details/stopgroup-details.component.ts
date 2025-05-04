import { Component, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { isValid } from '../../utilfunctions';
import { Location } from '@angular/common';
import { StopGroupStore } from '../../store/stopgroup.store';
import { StopGroup } from '../../types';

@Component({
  selector: 'app-stopgroup-details',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './stopgroup-details.component.html',
})
export class StopgroupDetailsComponent implements OnInit {
  private stopGroupStore = inject(StopGroupStore);
  private location: Location = inject(Location);

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

  async ngOnInit() {
    let stopGroup: StopGroup | undefined = undefined;
    while (stopGroup === undefined) {
      stopGroup = this.stopGroupStore.stopGroups().find((g) => g.id == this.id);
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
    if (!isValid(this.name(), 50)) {
      this.errorMessage.set('Name is invalid, must be less than 50 characters');
      return false;
    }
    if (!isValid(this.description(), 255)) {
      this.errorMessage.set('Description is invalid, must be less than 255 characters');
      return false;
    }
    return true;
  }

  async submitStopGroupDetails() {
    const stopGroup: StopGroup = {
      id: this.id,
      name: this.name(),
      description: this.description(),
      isPublic: this.isPublic(),
      stopIds: this.stopIds(),
    };
    if (this.id === -1) {
      await this.stopGroupStore.addStopGroup(stopGroup);
    } else {
      await this.stopGroupStore.updateStopGroup(stopGroup);
    }
    this.cancel.emit();
  }

  async deleteAndGoBack() {
    await this.stopGroupStore.deleteStopGroup(this.id);
    this.cancel.emit();
  }

  goBack() {
    this.cancel.emit();
  }
}
