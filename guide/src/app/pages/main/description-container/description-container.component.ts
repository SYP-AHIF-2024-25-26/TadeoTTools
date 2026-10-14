import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { marked } from 'marked';

/**
 * The description as text on the page sheet, no card; room and map link live in the title band.
 * Projected content sits in a column to the right of the text.
 */
@Component({
  selector: 'app-description-container',
  templateUrl: './description-container.component.html',
  styleUrl: './description-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionContainerComponent {
  title = input<string>();
  description = input<string>();

  /**
   * The description as Markdown (GFM, single line breaks kept); HTML in it passes
   * through. Angular's [innerHTML] sanitizer still strips scripts and handlers.
   */
  protected html = computed(() =>
    marked.parse(this.description() ?? '', {
      async: false,
      gfm: true,
      breaks: true,
    })
  );
}
