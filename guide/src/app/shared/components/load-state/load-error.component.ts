import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

/** Shown in place of a page's content when it could not be loaded and nothing is stored. */
@Component({
  selector: 'app-load-error',
  template: `
    <section
      class="rounded-2xl bg-white p-5 shadow-md ring-1 ring-gray-900/5"
      role="alert"
    >
      <h2 class="text-xl font-bold leading-7 text-gray-900">{{ heading() }}</h2>
      <p class="mt-2 text-lg leading-relaxed text-gray-700">{{ hint() }}</p>
      <button
        type="button"
        class="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-accent-700 pl-4 pr-5 text-base font-bold text-white shadow-md transition hover:bg-accent-800 active:scale-[0.98]"
        (click)="retry.emit()"
      >
        <svg
          class="h-5 w-5"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        Erneut versuchen
      </button>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadErrorComponent {
  heading = input.required<string>();
  hint = input(
    'Prüf dein WLAN oder deine mobilen Daten und versuch es noch einmal. Deine Häkchen bleiben auf diesem Handy gespeichert.'
  );
  retry = output<void>();
}
