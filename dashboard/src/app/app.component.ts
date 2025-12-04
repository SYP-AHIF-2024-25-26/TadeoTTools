import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { LoaderComponent } from './shared/components/loading-spinner/loading-spinner.component';
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
