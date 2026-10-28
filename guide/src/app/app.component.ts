import { RouterOutlet, Router, Routes } from '@angular/router';
import { NextYearPageComponent } from '@pages/next-year/next-year-page/next-year-page.component';
import { ApiFetchService } from '@core/services/api-fetch.service';
import { FeedbackOutboxService } from '@core/services/feedback-outbox.service';
import {
  Component,
  signal,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { environment } from '@env/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class AppComponent implements OnInit {
  url = signal(environment.apiBaseUrl);
  private apiService = inject(ApiFetchService);
  private router = inject(Router);
  // Created at app start so feedback left from an earlier visit is sent right away.
  private feedbackOutbox = inject(FeedbackOutboxService);

  async ngOnInit() {
    try {
      const showCountdown = await this.apiService.getShowCountdown();
      console.log('showing');

      if (showCountdown.isEnabled) {
        // Enforce ONLY countdown page by replacing routes
        const countdownRoutes: Routes = [
          { path: '', component: NextYearPageComponent },
          { path: '**', redirectTo: '' },
        ];
        this.router.resetConfig(countdownRoutes);
        this.router.navigate(['/']);
      }
    } catch (e) {
      console.error('Failed to check feature flag', e);
    }
  }
}
