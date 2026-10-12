import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { marked } from 'marked';

/**
 * Renders a stop description the way the GuideApp does: Markdown (GFM, single
 * line breaks kept) with HTML passed through. Angular's [innerHTML] sanitizer
 * still strips scripts and handlers.
 */
@Component({
  selector: 'app-markdown',
  template: `<div class="markdown break-words" [innerHTML]="html()"></div>`,
  styleUrl: './markdown.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownComponent {
  text = input<string | null | undefined>();

  protected html = computed(() =>
    marked.parse(this.text() ?? '', { async: false, gfm: true, breaks: true })
  );
}
