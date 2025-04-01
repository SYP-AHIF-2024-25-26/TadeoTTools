import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './standard-components/navbar/navbar.component';
import {PopupContainerComponent} from "./popups/popup-container/popup-container.component";

@Component({
    selector: 'app-root',
    standalone: true,
  imports: [RouterOutlet, NavbarComponent, PopupContainerComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'AdminDashboard';
}
