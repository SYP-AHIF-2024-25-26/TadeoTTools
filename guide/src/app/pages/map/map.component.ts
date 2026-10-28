import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { Router } from '@angular/router';
import { FLOORS, floorOf, isFloorCode } from '@shared/room';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  imports: [HeaderComponent, NavbarComponent],
  host: {
    '(swipeleft)': 'onSwipeLeft()',
    '(swiperight)': 'onSwipeRight()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent {
  roomNr = input<string>();
  private router = inject(Router);
  protected floors = FLOORS;

  /** Opens on the room's floor (the entrance floor if it can't be placed); the arrows change it. */
  currentFloor = linkedSignal(() => floorOf(this.roomNr()));
  currentFloorName = computed(() => FLOORS[this.currentFloor()].name);
  /** "Raum E24" in the band; a floor code like "EG" is no room, the panel heading names the floor. */
  roomLabel = computed(() => {
    const room = this.roomNr();
    return room && !isFloorCode(room) ? room : null;
  });

  onSwipeLeft() {
    this.router.navigate(['/feedback']);
  }

  onSwipeRight() {
    this.router.navigate(['/main']);
  }

  navigate(direction: number) {
    const newFloor = this.currentFloor() + direction;
    if (newFloor >= 0 && newFloor < FLOORS.length) {
      this.currentFloor.set(newFloor);
    }
  }

  /** Back to the stop; opened from a shared link or after a reload there is no stop to go back to. */
  onGoBack() {
    if (this.router.lastSuccessfulNavigation()?.previousNavigation) {
      window.history.back();
    } else {
      this.router.navigate(['/main']);
    }
  }
}
