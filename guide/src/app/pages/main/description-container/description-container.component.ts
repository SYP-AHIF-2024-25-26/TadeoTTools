import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The white reading card; room and map link live in the title band. */
@Component({
  selector: 'app-description-container',
  templateUrl: './description-container.component.html',
  styleUrl: './description-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionContainerComponent {
  title = input<string>();
  description = input<string>();
}
