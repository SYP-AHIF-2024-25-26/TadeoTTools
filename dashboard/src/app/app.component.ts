import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './standard-components/navbar/navbar.component';
import { InfoPopupComponent } from './popups/info-popup/info-popup.component';
import { InfoStore } from './store/info.store';
import { BASE_URL } from './app.config';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, InfoPopupComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'AdminDashboard';
  infoStore = inject(InfoStore);
  baseUrl = inject(BASE_URL);

  removeInfo(id: number) {
    this.infoStore.removeInfoById(id);
  }
}
