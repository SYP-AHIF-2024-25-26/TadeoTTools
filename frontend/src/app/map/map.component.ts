import { Component, computed, Input, signal } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  imports: [
    HeaderComponent,
    NavbarComponent,
    NgOptimizedImage,
  ],
})
export class MapComponent {
  @Input() roomNr: string | undefined;

   images = [
    '/assets/stockwerk-U.png',
    '/assets/stockwerk-E.png',
    '/assets/stockwerk-1.png',
     '/assets/stockwerk-2.png',
   ];

  currentFloor = signal(1);
  currentFloorSymbol = computed(() => {
    return ['Untergeschoss', 'Erdgeschoss', '1. Stock', '2. Stock'][this.currentFloor()];
  });

  ngOnInit() {
    if (this.roomNr) {
      this.currentFloor.set(this.images
        .findIndex(image => image.includes(this.roomNr!.charAt(0))));
    }
  }

  navigate(direction: number) {
    const newFloor = this.currentFloor() + direction;
    if (newFloor >= 0 && newFloor < this.images.length) {
      this.currentFloor.set(newFloor);
    }
  }
}