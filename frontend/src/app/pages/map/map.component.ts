import {
  Component,
  computed,
  HostListener,
  inject,
  Input,
  signal,
} from '@angular/core';
import { HeaderComponent } from '@shared/components/header/header.component';
import { NavbarComponent } from '@shared/components/navbar/navbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  imports: [HeaderComponent, NavbarComponent],
  standalone: true,
})
export class MapComponent {
  @Input() roomNr: string | undefined;
  private router = inject(Router);
  images = [
    'assets/stockwerk-U.png',
    'assets/stockwerk-E.png',
    'assets/stockwerk-1.png',
  ];

  currentFloor = signal(1);
  currentFloorSymbol = computed(() => {
    return ['Untergeschoss', 'Erdgeschoss', '1. Stock'][this.currentFloor()];
  });

  @HostListener('swipeleft')
  onSwipeLeft() {
    this.router.navigate(['/feedback']);
  }

  @HostListener('swiperight')
  onSwipeRight() {
    this.router.navigate(['/main']);
  }

  ngOnInit() {
    if (this.roomNr) {
      this.currentFloor.set(
        this.images.findIndex((image) => image.includes(this.roomNr!.charAt(0)))
      );
    }
  }

  navigate(direction: number) {
    const newFloor = this.currentFloor() + direction;
    if (newFloor >= 0 && newFloor < this.images.length) {
      this.currentFloor.set(newFloor);
    }
  }

  onGoBack() {
    window.history.back();
  }
}
