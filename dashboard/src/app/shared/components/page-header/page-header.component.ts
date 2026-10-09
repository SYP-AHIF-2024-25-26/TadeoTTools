import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The one page title of a dashboard page (DESIGN.md, Layout): the h1 on the
 * left, an optional subtitle under it and the page's actions (projected) on
 * the right. Below `sm` the actions wrap under the title.
 */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header
      class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-6 pt-8"
    >
      <div class="min-w-0">
        <h1 class="break-words text-2xl font-bold">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-sm text-ink-muted">{{ subtitle() }}</p>
        }
      </div>
      <div class="flex flex-wrap items-center gap-2 empty:hidden">
        <ng-content />
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>('');
}
