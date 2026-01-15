import { Component, computed, input, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Stop, Division } from '@/shared/models/types';
import { DeletePopupComponent } from '@/shared/modals/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-stop-divisions',
  standalone: true,
  imports: [FormsModule, DeletePopupComponent, NgClass],
  templateUrl: './stop-divisions.component.html',
})
export class StopDivisionsComponent {
  stop = model.required<Stop>();
  divisions = input.required<Division[]>();
  isAdmin = input.required<boolean>();

  inactiveDivisions = computed(() =>
    this.divisions().filter((d) => !this.stop().divisionIds.includes(d.id))
  );

  showRemoveDivisionPopup = signal<boolean>(false);
  divisionIdToRemove: string = '';
  isExpanded = signal<boolean>(true);

  toggle() {
    this.isExpanded.update((v) => !v);
  }

  getDivisionById(id: number): Division | undefined {
    return this.divisions().find((d) => d.id === id);
  }

  onDivisionSelect($event: Event) {
    const target = $event.target as HTMLSelectElement;
    const divisionId = parseInt(target.value);
    if (
      !this.stop().divisionIds.includes(divisionId) &&
      this.divisions().find((d) => d.id === divisionId)
    ) {
      this.stop.update((stop) => {
        stop.divisionIds = [divisionId, ...stop.divisionIds];
        return stop;
      });
    }
  }

  onDivisionRemove(divisionId: string) {
    this.divisionIdToRemove = divisionId;
    this.showRemoveDivisionPopup.set(true);
  }

  confirmDivisionRemove() {
    this.stop.update((stop) => {
      stop.divisionIds = stop.divisionIds.filter(
        (ids) => ids !== Number.parseInt(this.divisionIdToRemove)
      );
      return stop;
    });
    this.showRemoveDivisionPopup.set(false);
  }
}
