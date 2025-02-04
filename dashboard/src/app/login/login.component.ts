import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SettingsService } from '../settings.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private service: SettingsService = inject(SettingsService);

  apiKey = signal<string>('');

  constructor(private router: Router) {
    this.apiKey.set(localStorage.getItem('API_KEY') || '');
  }

  async saveApiKey() {
    if (this.apiKey() !== '') {
      localStorage.setItem('API_KEY', this.apiKey());
      if (await this.service.checkApiKeyExists(this.apiKey())) {
        this.router.navigate(['/stopgroups']);
      } else {
        alert('Invalid API key');
      }
    }
  }
}
