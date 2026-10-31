import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { SeenToggleComponent } from '@pages/main/seen-toggle/seen-toggle.component';
import { divisionFill } from '@shared/division-colors';
import { descriptionHtml } from '@shared/markdown';
import { Stop } from '@shared/models/types';

/** About this many characters fill the three lines; only longer texts fade out. */
const THREE_LINES = 120;

/** A stop in short on the map, so the visitor can decide whether to go to it. */
@Component({
  selector: 'app-stop-preview',
  imports: [SeenToggleComponent],
  templateUrl: './stop-preview.component.html',
  styleUrl: './stop-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-3' },
})
export class StopPreviewComponent {
  stop = input.required<Stop>();
  colors = input.required<string[]>();
  checked = input(false);
  open = output<void>();
  toggled = output<void>();

  protected fill = computed(() => divisionFill(this.colors()));
  protected html = computed(() => descriptionHtml(this.stop().description));
  protected isLong = computed(
    () => this.stop().description.length > THREE_LINES
  );
}
