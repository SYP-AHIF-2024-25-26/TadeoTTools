import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { BASE_URL } from '@app/app.config';

/**
 * The division's own icon from the dashboard. Visitors don't know the short names
 * (HIF, HITM, ALL), so nothing else is shown; a division without an icon shows nothing.
 */
@Component({
  selector: 'app-division-icon',
  template: `
    @if (!missing()) {
      <img
        class="block h-10 w-10 object-contain"
        [src]="baseUrl + '/v1/divisions/' + divisionId() + '/image'"
        alt=""
        (error)="missing.set(true)"
      />
    }
  `,
  host: { '[class.hidden]': 'missing()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DivisionIconComponent {
  divisionId = input.required<number>();

  protected baseUrl = inject(BASE_URL);
  protected missing = signal(false);
}
