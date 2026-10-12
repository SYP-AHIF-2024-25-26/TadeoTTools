import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HeaderComponent } from '@shared/components/header/header.component';
import { CountdownComponent } from '@pages/next-year/countdown/countdown.component';
import { ApiFetchService } from '@app/core/services/api-fetch.service';
import { openDayLine } from '@shared/open-day';

/** The only page while the countdown flag is on: when the next open day is, as a poster. */
@Component({
  selector: 'app-next-year-page',
  imports: [HeaderComponent, CountdownComponent],
  templateUrl: './next-year-page.component.html',
  styleUrl: './next-year-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextYearPageComponent implements OnInit {
  private apiService = inject(ApiFetchService);

  protected targetDate = signal<Date | null>(null);

  /** The friendly line above the countdown; the event name is the page title. */
  protected greeting = computed(() => {
    const date = this.targetDate();
    return date && date.getTime() <= Date.now()
      ? 'Heute geht’s los!'
      : 'Bald geht’s los!';
  });

  /** "Freitag, 20. November 2026, 13–19 Uhr". */
  protected dateLine = computed(() => {
    const date = this.targetDate();
    return date ? openDayLine(date) : '';
  });

  async ngOnInit() {
    const showCountdown = await this.apiService.getShowCountdown();
    const date = showCountdown.value ? new Date(showCountdown.value) : null;
    this.targetDate.set(date && !isNaN(date.getTime()) ? date : null);
  }
}
