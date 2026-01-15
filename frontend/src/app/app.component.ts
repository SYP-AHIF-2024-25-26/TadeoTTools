import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '@env/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  standalone: true,
})
export class AppComponent {
  url = signal(environment.apiBaseUrl);
}
