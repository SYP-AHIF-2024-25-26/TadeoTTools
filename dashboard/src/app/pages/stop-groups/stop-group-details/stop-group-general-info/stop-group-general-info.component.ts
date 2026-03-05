import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StopGroup } from '@/shared/models/types';

@Component({
  selector: 'app-stop-group-general-info',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './stop-group-general-info.component.html',
})
export class StopGroupGeneralInfoComponent {
  stopGroup = model.required<StopGroup>();

  updateName(name: string) {
    this.stopGroup.update((sg) => ({ ...sg, name }));
  }

  updateDescription(description: string) {
    this.stopGroup.update((sg) => ({ ...sg, description }));
  }

  updateIsPublic(isPublic: boolean) {
    this.stopGroup.update((sg) => ({ ...sg, isPublic }));
  }
}
