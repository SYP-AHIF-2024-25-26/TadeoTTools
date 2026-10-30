import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { SortDirection } from '@/shared/utils/sort';

/**
 * The button inside a sortable column header. The <th> itself carries
 * [attr.aria-sort] (see ariaSort in shared/utils/sort.ts), so screen readers
 * announce the order; the arrow shows it for everyone else.
 */
@Component({
  selector: 'app-sort-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-ink"
      [class.text-ink]="direction() !== null"
      [class.flex-row-reverse]="alignEnd()"
      (click)="sort.emit()"
    >
      {{ label() }}
      <svg
        class="h-3.5 w-3.5"
        [class.opacity-0]="direction() === null"
        [class.rotate-180]="direction() === 'desc'"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 15l7-7 7 7"
        />
      </svg>
    </button>
  `,
})
export class SortHeaderComponent {
  label = input.required<string>();
  // Null while the table is sorted by another column.
  direction = input<SortDirection | null>(null);
  // For right-aligned number columns: the arrow goes before the label.
  alignEnd = input(false, { transform: booleanAttribute });
  sort = output<void>();
}
