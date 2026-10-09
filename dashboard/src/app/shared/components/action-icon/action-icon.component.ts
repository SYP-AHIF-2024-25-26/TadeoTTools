import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The row action icons (DESIGN.md, Buttons): pencil = edit, eye = view only,
 * trash = delete. 16px outline icons; the surrounding button carries the
 * aria-label with the record's name.
 */
@Component({
  selector: 'app-action-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
  template: `
    <svg
      class="h-4 w-4"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('edit') {
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
          />
        }
        @case ('view') {
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        }
        @case ('delete') {
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        }
      }
    </svg>
  `,
})
export class ActionIconComponent {
  name = input.required<'edit' | 'view' | 'delete'>();
}
