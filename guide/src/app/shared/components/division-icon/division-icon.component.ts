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
        class="block object-contain"
        [class]="size() === 'lg' ? 'h-16 w-16' : 'h-10 w-10'"
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
  /** `lg` beside a description card, `md` in a header line. */
  size = input<'md' | 'lg'>('md');

  protected baseUrl = inject(BASE_URL);
  protected missing = signal(false);
}
