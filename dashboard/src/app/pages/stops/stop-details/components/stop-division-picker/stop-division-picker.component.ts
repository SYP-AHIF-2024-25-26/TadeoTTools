import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { Division } from '@/shared/models/types';

@Component({
  selector: 'app-stop-division-picker',
  templateUrl: './stop-division-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopDivisionPickerComponent {
  divisionIds = model.required<number[]>();
  divisions = input.required<Division[]>();
  // Only admins can change divisions; stop managers see them read-only.
  editable = input<boolean>(false);

  selected = computed(() =>
    this.divisionIds()
      .map((id) => this.divisions().find((d) => d.id === id))
      .filter((d): d is Division => d !== undefined)
  );

  available = computed(() =>
    this.divisions().filter((d) => !this.divisionIds().includes(d.id))
  );

  add(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    select.value = '';
    if (id && !this.divisionIds().includes(id)) {
      this.divisionIds.update((ids) => [...ids, id]);
    }
  }

  remove(id: number) {
    this.divisionIds.update((ids) => ids.filter((i) => i !== id));
  }
}
