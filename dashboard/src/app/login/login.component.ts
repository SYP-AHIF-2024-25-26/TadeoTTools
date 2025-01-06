import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  apiKey = signal<string>('');
  constructor(private router: Router) {
    this.apiKey.set(localStorage.getItem('API_KEY') || '');
  }

  saveApiKey() {
    if (this.apiKey() !== '') {
      localStorage.setItem('API_KEY', this.apiKey());
      this.router.navigate(['/stopgroups']);
    }
  }
}
