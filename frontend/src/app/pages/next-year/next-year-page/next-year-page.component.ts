import { Component, inject, OnInit, signal } from '@angular/core';
import { HeaderComponent } from '@shared/components/header/header.component';
import { CountdownComponent } from '@pages/next-year/countdown/countdown.component';
import { ApiFetchService } from '@app/core/services/api-fetch.service';

@Component({
  selector: 'app-next-year-page',
  imports: [HeaderComponent, CountdownComponent],
  templateUrl: './next-year-page.component.html',
  styleUrl: './next-year-page.component.css',
  standalone: true,
})
export class NextYearPageComponent implements OnInit {
  protected targetDate = signal<Date | null>(null);

  private apiService = inject(ApiFetchService);

  async ngOnInit() {
    const showCountdown = await this.apiService.getShowCountdown();
    if (showCountdown.value) {
      this.targetDate.set(new Date(showCountdown.value));
    }
  }
}
