import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './standard-components/navbar/navbar.component';
import { LoaderComponent } from './standard-components/loader/loader.component';
import { BASE_URL } from './app.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, LoaderComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'AdminDashboard';
  baseUrl = inject(BASE_URL);
  loading = signal(false);
}
