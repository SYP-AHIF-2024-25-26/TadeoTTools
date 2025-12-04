import { Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Stop, StopGroup } from '../../../../types';
import { DeletePopupComponent } from '../../../../popups/delete-popup/delete-popup.component';

@Component({
  selector: 'app-stop-groups',
  standalone: true,
  imports: [FormsModule, DeletePopupComponent],
  templateUrl: './stop-groups.component.html',
})
export class StopGroupsComponent {
  stop = model.required<Stop>();
  stopGroups = input.required<StopGroup[]>();
  isAdmin = input.required<boolean>();

  inactiveStopGroups = computed(() =>
    this.stopGroups().filter((g) => !this.stop().stopGroupIds.includes(g.id))
  );

  showRemoveStopGroupPopup = signal<boolean>(false);
  stopGroupIdToRemove: string = '';

  getStopGroupById(id: number) {
    return this.stopGroups().find((sg) => sg.id === id);
  }

  onStopGroupSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const stopGroupId = parseInt(target.value);
    if (
      !this.stop().stopGroupIds.includes(stopGroupId) &&
      this.stopGroups().find((g) => g.id === stopGroupId)
    ) {
      this.stop.update((stop) => {
        stop.stopGroupIds = [stopGroupId, ...stop.stopGroupIds];
        return stop;
      });
    }
  }

  onStopGroupRemove(stopGroupId: string) {
    this.stopGroupIdToRemove = stopGroupId;
    this.showRemoveStopGroupPopup.set(true);
  }

  confirmStopGroupRemove() {
    this.stop.update((stop) => {
      stop.stopGroupIds = stop.stopGroupIds.filter(
        (ids) => ids !== Number.parseInt(this.stopGroupIdToRemove)
      );
      return stop;
    });
    this.showRemoveStopGroupPopup.set(false);
  }
}
