import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { mapRoomOf } from '@shared/room';

@Component({
  selector: 'app-description-container',
  imports: [RouterLink],
  templateUrl: './description-container.component.html',
  styleUrl: './description-container.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionContainerComponent {
  title = input<string>();
  description = input<string>();
  roomNr = input<string>();
  /** Off when the title band already names the room. */
  showRoom = input<boolean>(true);

  protected mapRoom = computed(() => mapRoomOf(this.roomNr()));
}
