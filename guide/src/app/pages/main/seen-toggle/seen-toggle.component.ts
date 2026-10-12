import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/**
 * Full-width "Station gesehen" row under a stop's content, so a visitor can tick the stop
 * where they read about it. Neutral like every "seen" state: the same box as on the cards.
 */
@Component({
  selector: 'app-seen-toggle',
  template: `
    <label
      class="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-white py-1.5 pl-5 pr-1.5 shadow-md ring-1 ring-gray-900/5"
    >
      <input
        type="checkbox"
        class="peer sr-only"
        [checked]="checked()"
        (change)="toggled.emit()"
      />
      <span
        class="flex-1 text-lg font-bold leading-snug"
        [class]="checked() ? 'text-gray-500' : 'text-gray-900'"
        >Station gesehen</span
      >
      <span class="flex h-11 w-11 shrink-0 items-center justify-center">
        <span
          class="flex h-7 w-7 items-center justify-center rounded-lg ring-2 ring-inset transition-colors duration-150"
          [class]="
            checked()
              ? 'bg-gray-900 text-white ring-gray-900'
              : 'bg-white text-transparent ring-gray-400'
          "
          aria-hidden="true"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </span>
      </span>
    </label>
  `,
  styles: `
    /* Focus is drawn around the whole row, like the cards. */
    label:has(input:focus-visible) {
      outline: 3px solid theme('colors.accent.600');
      outline-offset: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeenToggleComponent {
  checked = input<boolean>(false);
  toggled = output<void>();
}
