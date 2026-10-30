import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { RegistrationOptions } from '@/shared/models/types';
import { OptionListComponent } from './option-list.component';

@Component({
  selector: 'app-registration-options',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OptionListComponent],
  template: `
    <p class="mb-4 text-sm text-ink-muted">
      The visitor picks one entry of each list at the kiosk, in this order.
      Changing a list does not change existing registrations: they keep the text
      they were saved with.
    </p>
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <app-option-list
        kind="reasons-for-visit"
        heading="Reasons for visit"
        noun="reason"
        placeholder="Messe Wels"
        [names]="options().reasonsForVisit"
        (changed)="changed.emit()"
      />
      <app-option-list
        kind="school-types"
        heading="School types"
        noun="school type"
        placeholder="Mittelschule"
        [names]="options().schoolTypes"
        (changed)="changed.emit()"
      />
    </div>
  `,
})
export class RegistrationOptionsComponent {
  options = input.required<RegistrationOptions>();
  changed = output<void>();
}
