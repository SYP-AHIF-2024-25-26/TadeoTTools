import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './standard-components/navbar/navbar.component';
import { InfoStore } from './store/info.store';
import { BASE_URL } from './app.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
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
