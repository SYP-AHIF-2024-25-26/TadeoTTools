import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { descriptionHtml } from '@shared/markdown';

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

  protected html = computed(() => descriptionHtml(this.description()));
}
