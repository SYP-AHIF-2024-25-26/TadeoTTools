import {Component, inject, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute, RouterModule} from '@angular/router';
import {isValid} from '../../utilfunctions';
import {firstValueFrom} from 'rxjs';
import {Location} from '@angular/common';
import {StopGroupStore} from "../../store/stopgroup.store";
import {StopGroup} from "../../types";

@Component({
  selector: 'app-stopgroup-details',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './stopgroup-details.component.html',
  styleUrl: './stopgroup-details.component.css'
})
export class StopgroupDetailsComponent implements OnInit {
  private stopGroupStore = inject(StopGroupStore);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private location: Location = inject(Location);

  stopGroupId = signal<number>(-1);
  name = signal<string>('');
  description = signal<string>('');
  isPublic = signal<boolean>(false);
  stopIds = signal<number[]>([]);
  errorMessage = signal<string>('');

  async ngOnInit() {
    const params = await firstValueFrom(this.route.queryParams);
    this.stopGroupId.set(params['id'] || -1);
    console.log(this.stopGroupId());
    console.log(this.stopGroupStore.stopGroups().map(s => s.id));
    let stopGroup: StopGroup | undefined = undefined;
    while (stopGroup === undefined) {
      stopGroup = this.stopGroupStore.stopGroups().find(g => g.id == this.stopGroupId());
      if (stopGroup === undefined) {
        await new Promise(resolve => setTimeout(resolve, 100));
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
      this.errorMessage.set(
        'Description is invalid, must be less than 255 characters'
      );
      return false;
    }
    return true;
  }

  async submitStopGroupDetails() {
    const stopGroup: StopGroup = {
      id: this.stopGroupId(),
      name: this.name(),
      description: this.description(),
      isPublic: this.isPublic(),
      stopIds: this.stopIds(),
    };
    if (this.stopGroupId() === -1) {
      await this.stopGroupStore.addStopGroup(stopGroup);
    } else {
      await this.stopGroupStore.updateStopGroup(stopGroup);
    }
    this.location.back();
  }

  async deleteAndGoBack() {
    await this.stopGroupStore.deleteStopGroup(this.stopGroupId());
    this.location.back();
  }

  goBack() {
    this.location.back();
  }
}
