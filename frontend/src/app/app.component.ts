import { RouterOutlet, Router, Routes } from '@angular/router';
import { NextYearPageComponent } from '@pages/next-year/next-year-page/next-year-page.component';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { Component, signal, OnInit, inject } from '@angular/core';
import { environment } from '@env/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  standalone: true,
})
export class AppComponent implements OnInit {
  url = signal(environment.apiBaseUrl);
  private apiService = inject(ApiFetchService);
  private router = inject(Router);

  async ngOnInit() {
    try {
      const showCountdown = await this.apiService.getShowCountdown();
      console.log("showing");
      
      if (showCountdown) {
        // Enforce ONLY countdown page by replacing routes
        const countdownRoutes: Routes = [
          { path: '', component: NextYearPageComponent },
          { path: '**', redirectTo: '' }
        ];
        this.router.resetConfig(countdownRoutes);
        this.router.navigate(['/']);
      }
    } catch (e) {
      console.error("Failed to check feature flag", e);
    }
  }
}
